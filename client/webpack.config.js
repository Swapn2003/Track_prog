module.exports = {
    devServer: {
        allowedHosts: 'all',
        client: {
            webSocketURL: {
                hostname: '0.0.0.0',
                pathname: '/ws',
                port: 0,
            },
        },
        headers: {
            'Access-Control-Allow-Origin': '*',
        }
    }
}; 