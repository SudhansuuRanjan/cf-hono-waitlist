export const generateRandomID = (digits = 8) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomID = '';
    for (let i = 0; i < digits; i++) {
        randomID += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return randomID.toLocaleLowerCase();
}