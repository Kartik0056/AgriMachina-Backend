const { processFarmerQuery } = require('../services/aiKnowledgeService');

const handleAIChatQuery = async (req, res) => {
  try {
    const { message, lang, language } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'A valid question message is required.'
      });
    }

    const effectiveLang = lang || language || 'hi';
    const aiResponse = await processFarmerQuery(message, effectiveLang);

    return res.status(200).json({
      success: true,
      data: aiResponse,
      text: aiResponse.text,
      products: aiResponse.products || [],
      actionLink: aiResponse.actionLink || null,
      supportActions: aiResponse.supportActions || []
    });
  } catch (error) {
    console.error('Error in AI Chat Controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate agricultural AI response.',
      error: error.message
    });
  }
};

module.exports = {
  handleAIChatQuery
};
