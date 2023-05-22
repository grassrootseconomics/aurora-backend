export const generateRandomString = (length: number): string => {
    const charset =
        'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.match(
            /./g
        );
    let text = '';
    for (let i = 0; i < length; i++) {
        text += charset[Math.floor(Math.random() * charset.length)];
    }
    return text;
};
