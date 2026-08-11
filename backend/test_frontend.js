const report = { impermissible_income_ratio: "0.0095" };
const fd = { total_revenue: 2491454085000, interest_income: 23674798000 };

const totalRevenue   = parseFloat(fd.total_revenue)||0;
const interestIncome = parseFloat(fd.interest_income)||0;

const impureRatioRaw = totalRevenue>0?(interestIncome/totalRevenue)*100:null;
const impureRatio = report.impermissible_income_ratio !== null && report.impermissible_income_ratio !== undefined ? parseFloat(report.impermissible_income_ratio) * 100 : impureRatioRaw;

console.log({ impureRatioRaw, impureRatio });
