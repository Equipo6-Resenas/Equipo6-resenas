require('dotenv').config();
const amqp = require('amqplib');

// Configuración 100 % por variables de entorno (nada fijo en el código).
const BROKER_URL = process.env.BROKER_URL || null;
const EVENT_EXCHANGE = process.env.EVENT_EXCHANGE || 'ticketu.events';
// Opcional: cola de evidencia enlazada a resena.creada (ver INTEGRACIONES.md, I3).
const COLA_EVIDENCIA = process.env.BROKER_QUEUE_EVIDENCIA || null;
const PUBLISH_TIMEOUT_MS = Number(process.env.BROKER_PUBLISH_TIMEOUT_MS) || 2000;
const RECONNECT_MS = Number(process.env.BROKER_RECONNECT_MS) || 5000;

let conexion = null;
let canal = null;
let conectando = null;
let temporizadorReconexion = null;
let cerrando = false;

// Todas las líneas llevan fecha y hora (trazabilidad, BR1 b).
// Nunca se imprime BROKER_URL porque contiene la contraseña.
const log = (nivel, mensaje) => {
  const linea = `${new Date().toISOString()} [broker] ${mensaje}`;
  if (nivel === 'error') console.error(linea);
  else console.log(linea);
};

const conectar = async () => {
  if (!BROKER_URL) throw new Error('BROKER_URL no está configurada');
  if (canal) return canal;
  if (conectando) return conectando;

  conectando = (async () => {
    const con = await amqp.connect(BROKER_URL);
    try {
      con.on('error', (err) => log('error', `error de conexión: ${err.message}`));
      con.on('close', () => {
        if (conexion === con) {
          conexion = null;
          canal = null;
        }
        if (!cerrando) {
          log('error', 'conexión con RabbitMQ cerrada; se reintentará');
          programarReconexion();
        }
      });

      const ch = await con.createConfirmChannel();
      ch.on('error', (err) => log('error', `error de canal: ${err.message}`));

      await ch.assertExchange(EVENT_EXCHANGE, 'topic', { durable: true });
      if (COLA_EVIDENCIA) {
        await ch.assertQueue(COLA_EVIDENCIA, { durable: true });
        await ch.bindQueue(COLA_EVIDENCIA, EVENT_EXCHANGE, 'resena.creada');
      }

      conexion = con;
      canal = ch;
      log('info', `conectado a RabbitMQ, exchange ${EVENT_EXCHANGE}`);
      return ch;
    } catch (error) {
      await con.close().catch(() => {});
      throw error;
    }
  })();

  try {
    return await conectando;
  } finally {
    conectando = null;
  }
};

const programarReconexion = () => {
  if (temporizadorReconexion || cerrando || !BROKER_URL) return;
  temporizadorReconexion = setTimeout(async () => {
    temporizadorReconexion = null;
    try {
      await conectar();
    } catch (error) {
      log('error', `reintento de conexión fallido: ${error.message}`);
      programarReconexion();
    }
  }, RECONNECT_MS);
  temporizadorReconexion.unref();
};

// Se llama al arrancar el servidor. Nunca lanza: si el broker no está, la app sigue.
const iniciarBroker = async () => {
  if (!BROKER_URL) {
    log('error', 'BROKER_URL no configurada; no se publicarán eventos');
    return;
  }
  try {
    await conectar();
  } catch (error) {
    log('error', `RabbitMQ no disponible al iniciar: ${error.message}`);
    programarReconexion();
  }
};

// Publica un evento. Nunca lanza: devuelve true/false.
const publicarEvento = async (routingKey, payload, correlationId) => {
  if (!BROKER_URL) {
    log('error', `BROKER_URL no configurada; ${routingKey} no publicada`);
    return false;
  }
  try {
    const ch = await conectar();
    const cuerpo = Buffer.from(JSON.stringify(payload));
    await new Promise((resolve, reject) => {
      const espera = setTimeout(
        () => reject(new Error('timeout esperando confirmación del broker')),
        PUBLISH_TIMEOUT_MS
      );
      ch.publish(
        EVENT_EXCHANGE,
        routingKey,
        cuerpo,
        {
          persistent: true,
          contentType: 'application/json',
          type: routingKey,
          correlationId,
          timestamp: Math.floor(Date.now() / 1000)
        },
        (err) => {
          clearTimeout(espera);
          if (err) reject(err);
          else resolve();
        }
      );
    });
    log('info', `${routingKey} publicada resenaId=${payload.resenaId} eventoId=${payload.eventoId}`);
    return true;
  } catch (error) {
    log('error', `no se pudo publicar ${routingKey}: ${error.message}`);
    programarReconexion();
    return false;
  }
};

// Evento resena.creada. Recibe la fila recién insertada en la tabla resenas.
const publicarResenaCreada = async (resena, correlationId) => {
  try {
    const payload = {
      resenaId: String(resena.num_resena),
      eventoId: String(resena.id_evento),
      usuarioId: String(resena.id_usuario),
      calificacion: resena.clasificacion,
      fecha: resena.fecha_reseña
        ? new Date(resena.fecha_reseña).toISOString()
        : new Date().toISOString()
    };
    return await publicarEvento('resena.creada', payload, correlationId);
  } catch (error) {
    log('error', `no se pudo armar resena.creada: ${error.message}`);
    return false;
  }
};

const cerrarBroker = async () => {
  cerrando = true;
  if (temporizadorReconexion) clearTimeout(temporizadorReconexion);
  try {
    if (canal) await canal.close();
    if (conexion) await conexion.close();
  } catch (error) {
    log('error', `error al cerrar RabbitMQ: ${error.message}`);
  }
};

module.exports = {
  iniciarBroker,
  publicarEvento,
  publicarResenaCreada,
  cerrarBroker
};