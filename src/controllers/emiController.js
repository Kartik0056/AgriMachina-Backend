const Product = require('../models/Product');
const { calculateEMIBreakdown, generateTenureTable } = require('../services/emiService');

const calculateEMI = (req, res) => {
  try {
    const { price, downPayment = 0, interestRate = 13.5, tenureMonths = 12, processingFee = 0 } = req.body;

    if (!price || Number(price) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid product price is required.' });
    }

    const breakdown = calculateEMIBreakdown(price, downPayment, interestRate, tenureMonths, processingFee);
    const tenureTable = generateTenureTable(price, downPayment, interestRate, [3, 6, 9, 12, 18, 24, 36], processingFee);

    return res.status(200).json({
      success: true,
      calculation: breakdown,
      tenureTable: tenureTable.plans
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getProductEMIPlans = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id, { sellingPrice: 1, emi: 1, name: 1 });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    if (!product.emi || !product.emi.enabled) {
      return res.status(200).json({
        success: true,
        emiEnabled: false,
        message: 'EMI is not enabled for this product.'
      });
    }

    const tenureOptions = product.emi.tenureOptions && product.emi.tenureOptions.length
      ? product.emi.tenureOptions
      : [3, 6, 9, 12, 18, 24, 36];

    const table = generateTenureTable(
      product.sellingPrice,
      product.emi.minDownPayment || 0,
      product.emi.interestRate || 13.5,
      tenureOptions,
      product.emi.processingFee || 499
    );

    return res.status(200).json({
      success: true,
      emiEnabled: true,
      productPrice: product.sellingPrice,
      minDownPayment: product.emi.minDownPayment,
      interestRate: product.emi.interestRate,
      processingFee: product.emi.processingFee,
      financePartners: product.emi.financePartners,
      minMonthlyEmi: product.emi.minMonthlyEmi,
      plans: table.plans
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  calculateEMI,
  getProductEMIPlans
};
