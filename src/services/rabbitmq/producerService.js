const amqp = require("amqplib");

const ProducerService = {
	sendMessage: async (queue, message) => {
		const connection = amqp.connect(process.env.RABBITMQ_SERVER);
		const channel = connection.createChannel();

		await channel.assertQueue(queue, {
			durable: true,
		});

		await channel.sendToQueue(queue, Buffer.from(message));

		setTimeout(() => {
			connection.close();
		}, 500);
	},
};

module.exports = ProducerService;
