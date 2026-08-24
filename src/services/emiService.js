/**
 * Reducing-Balance EMI Calculation Service
 * Formula: E = P * r * (1 + r)^n / ((1 + r)^n - 1)
 * where:
 *   P = Principal Loan Amount (Product Price - Down Payment)
 *   r = Monthly Interest Rate (Annual Rate / (12 * 100))
 *   n = Number of monthly installments (Tenure in months)
 */

const calculateMonthlyEMI = (principal, annualInterestRate, tenureMonths) => {
  if (principal <= 0 || tenureMonths <= 0) return 0;
  if (annualInterestRate <= 0) {
    return Math.round(principal / tenureMonths);
  }

  const monthlyRate = annualInterestRate / (12 * 100);
  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  const emi = (principal * monthlyRate * factor) / (factor - 1);
  
  return Math.round(emi);
};

const calculateEMIBreakdown = (productPrice, downPayment = 0, annualInterestRate = 13.5, tenureMonths = 12, processingFee = 0) => {
  const price = Math.max(0, Number(productPrice) || 0);
  const down = Math.min(price, Math.max(0, Number(downPayment) || 0));
  const principal = Math.max(0, price - down);
  const rate = Math.max(0, Number(annualInterestRate) || 13.5);
  const tenure = Math.max(1, Number(tenureMonths) || 12);
  const fee = Math.max(0, Number(processingFee) || 0);

  const monthlyEMI = calculateMonthlyEMI(principal, rate, tenure);
  const totalRepayment = (monthlyEMI * tenure);
  const totalInterest = Math.max(0, totalRepayment - principal);
  const totalCost = down + totalRepayment + fee;

  return {
    productPrice: price,
    downPayment: down,
    principalLoanAmount: principal,
    annualInterestRate: rate,
    tenureMonths: tenure,
    monthlyEMI,
    totalInterest,
    processingFee: fee,
    totalRepayment,
    totalCost,
    isEstimate: true,
    disclaimer: 'Calculations are estimates based on reducing balance standard. Final financing approval and rates depend on bank verification.'
  };
};

const generateTenureTable = (productPrice, downPayment = 0, annualInterestRate = 13.5, tenureOptions = [3, 6, 9, 12, 18, 24, 36], processingFee = 0) => {
  const price = Math.max(0, Number(productPrice) || 0);
  const down = Math.min(price, Math.max(0, Number(downPayment) || 0));
  const principal = Math.max(0, price - down);
  const rate = Math.max(0, Number(annualInterestRate) || 13.5);
  const fee = Math.max(0, Number(processingFee) || 0);

  const plans = tenureOptions.map(tenure => {
    const monthlyEMI = calculateMonthlyEMI(principal, rate, tenure);
    const totalRepayment = (monthlyEMI * tenure);
    const totalInterest = Math.max(0, totalRepayment - principal);

    return {
      tenureMonths: tenure,
      monthlyEMI,
      totalInterest,
      processingFee: fee,
      totalPayable: totalRepayment + fee + down,
      effectiveMonthlyCost: Math.round(monthlyEMI + (fee / tenure))
    };
  });

  return {
    productPrice: price,
    downPayment: down,
    principalLoanAmount: principal,
    annualInterestRate: rate,
    plans
  };
};

module.exports = {
  calculateMonthlyEMI,
  calculateEMIBreakdown,
  generateTenureTable
};
