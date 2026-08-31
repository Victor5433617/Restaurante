module.exports = {
    launch: async () => ({
        newPage: async () => ({
            setContent: async () => {},
            pdf: async () => Buffer.from(''),
            close: async () => {},
        }),
        close: async () => {},
    }),
};
