import customizeAxios from "../components/customizeAxios";

const getBalanceService = (userId) => {
    return customizeAxios.get(`/wallet/balance/${userId}`,{userId: userId});
};

const depositService = (userId, amount) => {
    return customizeAxios.post(`/wallet/deposit`,{ userId, amount});
};

const createPaymentUrlService = (amount, orderDescription, orderType, language, bankCode) => {
    return customizeAxios.post(`/payment/create_payment_url`, {
        amount,
        orderDescription,
        orderType,
        language,
        bankCode,
    });
};

export {
    getBalanceService,
    depositService,
    createPaymentUrlService,
};
