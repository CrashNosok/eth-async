export function getProxyConfigAxios(proxy: string): any {
    proxy = proxy.replace('http://', '');

    const [usernamePassword, serverPort] = proxy.split('@');
    const [username, password] = usernamePassword.split(':');
    const [server, port] = serverPort.split(':');

    const proxyConfig = {
        proxy: {
            host: server,
            port: port,
            auth: {
            username: username,
            password: password
            }
        }
    };

    return proxyConfig;
}
