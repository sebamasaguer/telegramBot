const bot = require('../bot');

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      await bot.handleUpdate(req.body);
      res.status(200).send('OK');
    } catch (err) {
      console.error('Telegram bot error:', err);
      res.status(500).send('Error');
    }
  } else {
    res.status(200).send('Bot está vivo 🟢');
  }
};