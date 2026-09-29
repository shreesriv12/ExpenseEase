export const formatMoney=paise=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(paise/100);
