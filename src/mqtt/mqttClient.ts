import mqtt, { MqttClient } from "mqtt";

const mqttServer = process.env.MQTT_SERVER || "mqtt://broker.emqx.io";
const mqttPort = process.env.MQTT_PORT || "1883";
const mqttUser = process.env.MQTT_USER || "";
const mqttPass = process.env.MQTT_PASS || "";
const clientId = process.env.MQTT_CLIENT_ID || "mqttx_846b7d7c";

const client: MqttClient = mqtt.connect(mqttServer, {
  port: Number(mqttPort),
  username: mqttUser,
  password: mqttPass,
  clientId
});

client.on("connect", () => {
  console.log("Conectado al broker MQTT:", mqttServer);
  // Suscribirse a los topics del ESP32
  client.subscribe("esp32/#", (err) => {
    if (err) console.error("Error al suscribirse:", err);
  });
});

client.on("error", (err) => {
  console.error("Error en la conexión MQTT:", err);
});

export default client;
