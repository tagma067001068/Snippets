import { connect } from 'cloudflare:sockets';

let authToken = '351c9981-04b6-4103-aa4b-864aa9c91469';
let fallbackAddress = 'ProxyIP.SG.CMLiussss.net';
let fallbackPort = '443';
let socks5Config = '';
let customPreferredIPs = [];
let customPreferredDomains = [];
let enableSocksDowngrade = false;
let disablePort80 = false;
let disablePreferred = false;

let enableRegionMatching = true;
let currentWorkerRegion = '';

const regionMapping = {
    'US': ['🇺🇸 美国', 'US', 'United States'],
    'SG': ['🇸🇬 新加坡', 'SG', 'Singapore'],
    'JP': ['🇯🇵 日本', 'JP', 'Japan'],
    'HK': ['🇭🇰 香港', 'HK', 'Hong Kong'],
    'KR': ['🇰🇷 韩国', 'KR', 'South Korea'],
    'DE': ['🇩🇪 德国', 'DE', 'Germany'],
    'SE': ['🇸🇪 瑞典', 'SE', 'Sweden'],
    'NL': ['🇳🇱 荷兰', 'NL', 'Netherlands'],
    'FI': ['🇫🇮 芬兰', 'FI', 'Finland'],
    'GB': ['🇬🇧 英国', 'GB', 'United Kingdom'],
    'Oracle': ['甲骨文', 'Oracle'],
    'DigitalOcean': ['数码海', 'DigitalOcean'],
    'Vultr': ['Vultr', 'Vultr'],
    'Multacom': ['Multacom', 'Multacom']
};

let backupIPs = [
    { domain: 'ProxyIP.US.CMLiussss.net', region: 'US', regionCode: 'US', port: 443 },
    { domain: 'ProxyIP.SG.CMLiussss.net', region: 'SG', regionCode: 'SG', port: 443 },
    { domain: 'ProxyIP.JP.CMLiussss.net', region: 'JP', regionCode: 'JP', port: 443 },
    { domain: 'ProxyIP.HK.CMLiussss.net', region: 'HK', regionCode: 'HK', port: 443 },
    { domain: 'ProxyIP.KR.CMLiussss.net', region: 'KR', regionCode: 'KR', port: 443 },
    { domain: 'ProxyIP.DE.CMLiussss.net', region: 'DE', regionCode: 'DE', port: 443 },
    { domain: 'ProxyIP.SE.CMLiussss.net', region: 'SE', regionCode: 'SE', port: 443 },
    { domain: 'ProxyIP.NL.CMLiussss.net', region: 'NL', regionCode: 'NL', port: 443 },
    { domain: 'ProxyIP.FI.CMLiussss.net', region: 'FI', regionCode: 'FI', port: 443 },
    { domain: 'ProxyIP.GB.CMLiussss.net', region: 'GB', regionCode: 'GB', port: 443 },
    { domain: 'ProxyIP.Oracle.cmliussss.net', region: 'Oracle', regionCode: 'Oracle', port: 443 },
    { domain: 'ProxyIP.DigitalOcean.CMLiussss.net', region: 'DigitalOcean', regionCode: 'DigitalOcean', port: 443 },
    { domain: 'ProxyIP.Vultr.CMLiussss.net', region: 'Vultr', regionCode: 'Vultr', port: 443 },
    { domain: 'ProxyIP.Multacom.CMLiussss.net', region: 'Multacom', regionCode: 'Multacom', port: 443 }
];

const directDomains = [
    { name: "cloudflare.182682.xyz", domain: "cloudflare.182682.xyz" }, { name: "speed.marisalnc.com", domain: "speed.marisalnc.com" },
    { domain: "freeyx.cloudflare88.eu.org" }, { domain: "bestcf.top" }, { domain: "cdn.2020111.xyz" }, { domain: "cfip.cfcdn.vip" },
    { domain: "cf.0sm.com" }, { domain: "cf.090227.xyz" }, { domain: "cf.zhetengsha.eu.org" }, { domain: "cloudflare.9jy.cc" },
    { domain: "cf.zerone-cdn.pp.ua" }, { domain: "cfip.1323123.xyz" }, { domain: "cnamefuckxxs.yuchen.icu" }, { domain: "cloudflare-ip.mofashi.ltd" },
    { domain: "115155.xyz" }, { domain: "cname.xirancdn.us" }, { domain: "f3058171cad.002404.xyz" }, { domain: "8.889288.xyz" },
    { domain: "cdn.tzpro.xyz" }, { domain: "cf.877771.xyz" }, { domain: "xn--b6gac.eu.org" }
];

const E_INVALID_DATA = atob('aW52YWxpZCBkYXRh');
const E_INVALID_USER = atob('aW52YWxpZCB1c2Vy');
const E_UNSUPPORTED_CMD = atob('Y29tbWFuZCBpcyBub3Qgc3VwcG9ydGVk');
const E_UDP_DNS_ONLY = atob('VURQIHByb3h5IG9ubHkgZW5hYmxlIGZvciBETlMgd2hpY2ggaXMgcG9ydCA1Mw==');
const E_INVALID_ADDR_TYPE = atob('aW52YWxpZCBhZGRyZXNzVHlwZQ==');
const E_EMPTY_ADDR = atob('YWRkcmVzc1ZhbHVlIGlzIGVtcHR5');
const E_WS_NOT_OPEN = atob('d2ViU29ja2V0LmVhZHlTdGF0ZSBpcyBub3Qgb3Blbg==');
const E_INVALID_ID_STR = atob('U3RyaW5naWZpZWQgaWRlbnRpZmllciBpcyBpbnZhbGlk');
const E_INVALID_SOCKS_ADDR = atob('SW52YWxpZCBTT0NLUyBhZGRyZXNzIGZvcm1hdA==');
const E_SOCKS_NO_METHOD = atob('bm8gYWNjZXB0YWJsZSBtZXRob2Rz');
const E_SOCKS_AUTH_NEEDED = atob('c29ja3Mgc2VydmVyIG5lZWRzIGF1dGg=');
const E_SOCKS_AUTH_FAIL = atob('ZmFpbCB0byBhdXRoIHNvY2tzIHNlcnZlcg==');
const E_SOCKS_CONN_FAIL = atob('ZmFpbCB0byBvcGVuIHNvY2tzIGNvbm5lY3Rpb24=');

let parsedSocks5Config = {};
let isSocksEnabled = false;

const ADDRESS_TYPE_IPV4 = 1;
const ADDRESS_TYPE_URL = 2;
const ADDRESS_TYPE_IPV6 = 3;

function isValidFormat(str) {
    const userRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return userRegex.test(str);
}

function isValidIP(ip) {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (ipv4Regex.test(ip)) return true;
    
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    if (ipv6Regex.test(ip)) return true;
    
    const ipv6ShortRegex = /^::1$|^::$|^(?:[0-9a-fA-F]{1,4}:)*::(?:[0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4}$/;
    if (ipv6ShortRegex.test(ip)) return true;
    
    return false;
}

async function detectWorkerRegion(request) {
    try {
        let workerIP = null;
        try {
            const ipResponse = await fetch('https://ipv4-overseas.itdog.plus/', {
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; CF-Worker/1.0)',
                    'Accept': 'application/json'
                },
                signal: AbortSignal.timeout(5000)
            });
            
            if (ipResponse.ok) {
                const ipData = await ipResponse.json();
                if (ipData.type === 'success' && ipData.ip) {
                    workerIP = ipData.ip;
                } else {
                    workerIP = '8.8.8.8';
                }
            } else {
                workerIP = '8.8.8.8';
            }
        } catch (error) {
            workerIP = '8.8.8.8';
        }
        
        const bestBackupIP = await getBestBackupIP('HK');
        if (bestBackupIP) {
            const apiUrl = `https://joeyblog.net/api/t.php?ip=${workerIP}`;
            try {
                const response = await fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (compatible; CF-Worker/1.0)',
                        'Accept': 'application/json'
                    },
                    signal: AbortSignal.timeout(5000)
                });
                
                if (response.ok) {
                    const data = await response.json();
                    let countryCode = null;
                    
                    if (data.user_country_code) {
                        countryCode = data.user_country_code.toUpperCase();
                    } else if (data.user_country) {
                        const countryNameToCode = {
                            'United States': 'US', 'Singapore': 'SG', 'Japan': 'JP',
                            'Hong Kong': 'HK', 'South Korea': 'KR', 'Germany': 'DE',
                            'Sweden': 'SE', 'Netherlands': 'NL', 'Finland': 'FI', 'United Kingdom': 'GB'
                        };
                        countryCode = countryNameToCode[data.user_country] || data.user_country;
                    }
                    
                    if (countryCode) {
                        const countryToRegion = {
                            'US': 'US', 'SG': 'SG', 'JP': 'JP', 'HK': 'HK', 'KR': 'KR',
                            'DE': 'DE', 'SE': 'SE', 'NL': 'NL', 'FI': 'FI', 'GB': 'GB',
                            'CN': 'HK', 'TW': 'HK', 'AU': 'SG', 'CA': 'US',
                            'FR': 'DE', 'IT': 'DE', 'ES': 'DE', 'CH': 'DE',
                            'AT': 'DE', 'BE': 'NL', 'DK': 'SE', 'NO': 'SE', 'IE': 'GB'
                        };
                        
                        if (countryToRegion[countryCode]) {
                            return countryToRegion[countryCode];
                        } else {
                            return 'HK';
                        }
                    } else {
                        return 'HK';
                    }
                } else {
                    return 'HK';
                }
            } catch (apiError) {
                return 'HK';
            }
        } else {
            return 'HK';
        }
        
    } catch (error) {
        console.error('地区检测失败:', error);
        return 'US';
    }
}

async function checkIPAvailability(domain, port = 443, timeout = 2000) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const response = await fetch(`https://${domain}`, {
            method: 'HEAD',
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; CF-IP-Checker/1.0)'
            }
        });
        
        clearTimeout(timeoutId);
        return response.status < 500;
    } catch (error) {
        return true;
    }
}

async function getBestBackupIP(workerRegion = '') {
    
    if (backupIPs.length === 0) {
        return null;
    }
    
    const availableIPs = backupIPs.map(ip => ({ ...ip, available: true }));
    
    if (enableRegionMatching && workerRegion) {
        const sortedIPs = getSmartRegionSelection(workerRegion, availableIPs);
        if (sortedIPs.length > 0) {
            const selectedIP = sortedIPs[0];
            return selectedIP;
        }
    }
    
    const selectedIP = availableIPs[0];
    return selectedIP;
}

function getNearbyRegions(region) {
    const nearbyMap = {
        'US': ['SG', 'JP', 'HK', 'KR'], // 美国 -> 亚太地区
        'SG': ['JP', 'HK', 'KR', 'US'], // 新加坡 -> 亚太地区
        'JP': ['SG', 'HK', 'KR', 'US'], // 日本 -> 亚太地区
        'HK': ['SG', 'JP', 'KR', 'US'], // 香港 -> 亚太地区
        'KR': ['JP', 'HK', 'SG', 'US'], // 韩国 -> 亚太地区
        'DE': ['NL', 'GB', 'SE', 'FI'], // 德国 -> 欧洲地区
        'SE': ['DE', 'NL', 'FI', 'GB'], // 瑞典 -> 北欧地区
        'NL': ['DE', 'GB', 'SE', 'FI'], // 荷兰 -> 西欧地区
        'FI': ['SE', 'DE', 'NL', 'GB'], // 芬兰 -> 北欧地区
        'GB': ['DE', 'NL', 'SE', 'FI']  // 英国 -> 西欧地区
    };
    
    return nearbyMap[region] || [];
}

function getAllRegionsByPriority(region) {
    const nearbyRegions = getNearbyRegions(region);
    const allRegions = ['US', 'SG', 'JP', 'HK', 'KR', 'DE', 'SE', 'NL', 'FI', 'GB'];
    
    return [region, ...nearbyRegions, ...allRegions.filter(r => r !== region && !nearbyRegions.includes(r))];
}

function getSmartRegionSelection(workerRegion, availableIPs) {
    
    if (!enableRegionMatching || !workerRegion) {
        return availableIPs;
    }
    
    const priorityRegions = getAllRegionsByPriority(workerRegion);
    
    const sortedIPs = [];
    
    for (const region of priorityRegions) {
        const regionIPs = availableIPs.filter(ip => ip.regionCode === region);
        sortedIPs.push(...regionIPs);
    }
    
    return sortedIPs;
}

function parseAddressAndPort(input) {
    if (input.includes('[') && input.includes(']')) {
        const match = input.match(/^\[([^\]]+)\](?::(\d+))?$/);
        if (match) {
            return {
                address: match[1],
                port: match[2] ? parseInt(match[2], 10) : null
            };
        }
    }
    
    const lastColonIndex = input.lastIndexOf(':');
    if (lastColonIndex > 0) {
        const address = input.substring(0, lastColonIndex);
        const portStr = input.substring(lastColonIndex + 1);
        const port = parseInt(portStr, 10);
        
        if (!isNaN(port) && port > 0 && port <= 65535) {
            return { address, port };
        }
    }
    
    return { address: input, port: null };
}

export default {
	async fetch(request, env, ctx) {
		try {
			authToken = (env.u || env.U || authToken).toLowerCase();
			const subPath = (env.d || env.D || authToken).toLowerCase();
			
			const customIP = env.p || env.P;
			let useCustomIP = false;
			
			if (customIP && customIP.trim()) {
				useCustomIP = true;
				currentWorkerRegion = 'CUSTOM';
			} else {
				currentWorkerRegion = await detectWorkerRegion(request);
			}
			
			const regionMatchingControl = env.rm || env.RM;
			if (regionMatchingControl && regionMatchingControl.toLowerCase() === 'no') {
				enableRegionMatching = false;
			}
			
			const envFallback = env.p || env.P;
			if (envFallback) {
				const fallbackValue = envFallback.toLowerCase();
				if (fallbackValue.includes(']:')) {
					const lastColonIndex = fallbackValue.lastIndexOf(':');
					fallbackPort = fallbackValue.slice(lastColonIndex + 1);
					fallbackAddress = fallbackValue.slice(0, lastColonIndex);
				} else if (!fallbackValue.includes(']:') && !fallbackValue.includes(']')) {
					[fallbackAddress, fallbackPort = '443'] = fallbackValue.split(':');
				} else {
					fallbackAddress = fallbackValue;
					fallbackPort = '443';
				}
			}

			socks5Config = env.s || env.S || socks5Config;
			if (socks5Config) {
				try {
					parsedSocks5Config = parseSocksConfig(socks5Config);
					isSocksEnabled = true;
				} catch (err) {
					isSocksEnabled = false;
				}
			}

			const customPreferred = env.yx || env.YX;
			if (customPreferred) {
				try {
					const preferredList = customPreferred.split(',').map(item => item.trim()).filter(item => item);
					customPreferredIPs = [];
					customPreferredDomains = [];
					
					preferredList.forEach(item => {
						const { address, port } = parseAddressAndPort(item);
						
						if (isValidIP(address)) {
							customPreferredIPs.push({ 
								ip: address, 
								port: port,
								isp: '自定义优选-' + address + (port ? ':' + port : '') 
							});
						} else {
							customPreferredDomains.push({ 
								domain: address, 
								port: port,
								name: '自定义优选-' + address + (port ? ':' + port : '') 
							});
						}
					});
				} catch (err) {
					customPreferredIPs = [];
					customPreferredDomains = [];
				}
			}

			const downgradeControl = env.qj || env.QJ;
			if (downgradeControl && downgradeControl.toLowerCase() === 'no') {
				enableSocksDowngrade = true;
			}

			const dkbyControl = env.dkby || env.DKBY;
			if (dkbyControl && dkbyControl.toLowerCase() === 'yes') {
				disablePort80 = true;
			}

			const yxbyControl = env.yxby || env.YXBY;
			if (yxbyControl && yxbyControl.toLowerCase() === 'yes') {
				disablePreferred = true;
			}

			const url = new URL(request.url);

			if (request.headers.get('Upgrade') === 'websocket') {
				return await handleWsRequest(request);
			} else if (request.method === 'GET') {
				if (url.pathname === '/region') {
					const customIP = env.p || env.P;
					if (customIP && customIP.trim()) {
						return new Response(JSON.stringify({
							region: 'CUSTOM',
							detectionMethod: '自定义IP模式',
							customIP: customIP,
							timestamp: new Date().toISOString()
						}), {
							headers: { 'Content-Type': 'application/json' }
						});
					} else {
						const detectedRegion = await detectWorkerRegion(request);
						return new Response(JSON.stringify({
							region: detectedRegion,
							detectionMethod: 'API检测',
							timestamp: new Date().toISOString()
						}), {
							headers: { 'Content-Type': 'application/json' }
						});
					}
				}
				
				if (url.pathname === '/test-api') {
					try {
						const testRegion = await detectWorkerRegion(request);
						return new Response(JSON.stringify({
							detectedRegion: testRegion,
							message: 'API测试完成',
							timestamp: new Date().toISOString()
						}), {
							headers: { 'Content-Type': 'application/json' }
						});
					} catch (error) {
						return new Response(JSON.stringify({
							error: error.message,
							message: 'API测试失败'
						}), {
							status: 500,
							headers: { 'Content-Type': 'application/json' }
						});
					}
				}
				
				if (url.pathname === '/test-ip-api') {
					try {
						let workerIP = '8.8.8.8'; // 默认IP
						try {
							const ipResponse = await fetch('https://ipv4-overseas.itdog.plus/');
							if (ipResponse.ok) {
								const ipData = await ipResponse.json();
								if (ipData.type === 'success' && ipData.ip) {
									workerIP = ipData.ip;
								}
							}
						} catch (ipError) {
						}
						
						const response = await fetch(`https://joeyblog.net/api/t.php?ip=${workerIP}`);
						const data = await response.json();
						return new Response(JSON.stringify({
							apiResponse: data,
							workerIP: workerIP,
							message: '双重API测试完成',
							timestamp: new Date().toISOString()
						}), {
							headers: { 'Content-Type': 'application/json' }
						});
					} catch (error) {
						return new Response(JSON.stringify({
							error: error.message,
							message: '双重API测试失败'
						}), {
							status: 500,
							headers: { 'Content-Type': 'application/json' }
						});
					}
				}
				if (url.pathname === '/') {
					const terminalHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>终端</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: "Courier New", monospace;
            background: #000; color: #00ff00; min-height: 100vh;
            overflow-x: hidden; position: relative;
            display: flex; justify-content: center; align-items: center;
        }
        .matrix-bg {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: linear-gradient(45deg, #000 0%, #001100 50%, #000 100%);
            z-index: -1;
            animation: bg-pulse 8s ease-in-out infinite;
        }
        @keyframes bg-pulse {
            0%, 100% { background: linear-gradient(45deg, #000 0%, #001100 50%, #000 100%); }
            50% { background: linear-gradient(45deg, #000 0%, #002200 50%, #000 100%); }
        }
        .matrix-rain {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.03) 2px, rgba(0,255,0,0.03) 4px);
            animation: matrix-fall 20s linear infinite;
            z-index: -1;
        }
        @keyframes matrix-fall {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(100vh); }
        }
        .matrix-code-rain {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            pointer-events: none; z-index: -1;
            overflow: hidden;
        }
        .matrix-column {
            position: absolute; top: -100%; left: 0;
            color: #00ff00; font-family: "Courier New", monospace;
            font-size: 14px; line-height: 1.2;
            animation: matrix-drop 15s linear infinite;
            text-shadow: 0 0 5px #00ff00;
        }
        @keyframes matrix-drop {
            0% { top: -100%; opacity: 1; }
            10% { opacity: 1; }
            90% { opacity: 0.3; }
            100% { top: 100vh; opacity: 0; }
        }
        .matrix-column:nth-child(odd) {
            animation-duration: 12s;
            animation-delay: -2s;
        }
        .matrix-column:nth-child(even) {
            animation-duration: 18s;
            animation-delay: -5s;
        }
        .matrix-column:nth-child(3n) {
            animation-duration: 20s;
            animation-delay: -8s;
        }
        .terminal {
            width: 90%; max-width: 800px; height: 500px;
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid #00ff00;
            border-radius: 8px;
            box-shadow: 0 0 30px rgba(0, 255, 0, 0.5), inset 0 0 20px rgba(0, 255, 0, 0.1);
            backdrop-filter: blur(10px);
            position: relative; z-index: 1;
            overflow: hidden;
        }
        .terminal-header {
            background: rgba(0, 20, 0, 0.8);
            padding: 10px 15px;
            border-bottom: 1px solid #00ff00;
            display: flex; align-items: center;
        }
        .terminal-buttons {
            display: flex; gap: 8px;
        }
        .terminal-button {
            width: 12px; height: 12px; border-radius: 50%;
            background: #ff5f57; border: none;
        }
        .terminal-button:nth-child(2) { background: #ffbd2e; }
        .terminal-button:nth-child(3) { background: #28ca42; }
        .terminal-title {
            margin-left: 15px; color: #00ff00;
            font-size: 14px; font-weight: bold;
        }
        .terminal-body {
            padding: 20px; height: calc(100% - 50px);
            overflow-y: auto; font-size: 14px;
            line-height: 1.4;
        }
        .terminal-line {
            margin-bottom: 8px; display: flex; align-items: center;
        }
        .terminal-prompt {
            color: #00ff00; margin-right: 10px;
            font-weight: bold;
        }
        .terminal-input {
            background: transparent; border: none; outline: none;
            color: #00ff00; font-family: "Courier New", monospace;
            font-size: 14px; flex: 1;
            caret-color: #00ff00;
        }
        .terminal-input::placeholder {
            color: #00aa00; opacity: 0.7;
        }
        .terminal-cursor {
            display: inline-block; width: 8px; height: 16px;
            background: #00ff00; animation: blink 1s infinite;
            margin-left: 2px;
        }
        @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
        }
        .terminal-output {
            color: #00aa00; margin: 5px 0;
        }
        .terminal-error {
            color: #ff4444; margin: 5px 0;
        }
        .terminal-success {
            color: #44ff44; margin: 5px 0;
        }
        .matrix-text {
            position: fixed; top: 20px; right: 20px;
            color: #00ff00; font-family: "Courier New", monospace;
            font-size: 0.8rem; opacity: 0.6;
            animation: matrix-flicker 3s infinite;
        }
        @keyframes matrix-flicker {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
        }
    </style>
</head>
<body>
    <div class="matrix-bg"></div>
    <div class="matrix-rain"></div>
    <div class="matrix-code-rain" id="matrixCodeRain"></div>
    <div class="matrix-text">终端</div>
    <div class="terminal">
        <div class="terminal-header">
            <div class="terminal-buttons">
                <div class="terminal-button"></div>
                <div class="terminal-button"></div>
                <div class="terminal-button"></div>
            </div>
            <div class="terminal-title">终端</div>
        </div>
        <div class="terminal-body" id="terminalBody">
            <div class="terminal-line">
                <span class="terminal-prompt">root:~$</span>
                <span class="terminal-output">恭喜你来到这</span>
            </div>
            <div class="terminal-line">
                <span class="terminal-prompt">root:~$</span>
                <span class="terminal-output">请输入你U变量的值</span>
            </div>
            <div class="terminal-line">
                <span class="terminal-prompt">root:~$</span>
                <span class="terminal-output">命令: connect [UUID]</span>
            </div>
            <div class="terminal-line">
                <span class="terminal-prompt">root:~$</span>
                <input type="text" class="terminal-input" id="uuidInput" placeholder="输入U变量的内容并且回车..." autofocus>
                <span class="terminal-cursor"></span>
            </div>
        </div>
    </div>
    <script>
        function createMatrixRain() {
            const matrixContainer = document.getElementById('matrixCodeRain');
            const matrixChars = '01ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
            const columns = Math.floor(window.innerWidth / 18);
            
            for (let i = 0; i < columns; i++) {
                const column = document.createElement('div');
                column.className = 'matrix-column';
                column.style.left = (i * 18) + 'px';
                column.style.animationDelay = Math.random() * 15 + 's';
                column.style.animationDuration = (Math.random() * 15 + 8) + 's';
                column.style.fontSize = (Math.random() * 4 + 12) + 'px';
                column.style.opacity = Math.random() * 0.8 + 0.2;
                
                let text = '';
                const charCount = Math.floor(Math.random() * 30 + 20);
                for (let j = 0; j < charCount; j++) {
                    const char = matrixChars[Math.floor(Math.random() * matrixChars.length)];
                    const brightness = Math.random() > 0.1 ? '#00ff00' : '#00aa00';
                    text += '<span style="color: ' + brightness + ';">' + char + '</span><br>';
                }
                column.innerHTML = text;
                matrixContainer.appendChild(column);
            }
            
            setInterval(function() {
                const columns = matrixContainer.querySelectorAll('.matrix-column');
                columns.forEach(function(column) {
                    if (Math.random() > 0.95) {
                        const chars = column.querySelectorAll('span');
                        if (chars.length > 0) {
                            const randomChar = chars[Math.floor(Math.random() * chars.length)];
                            randomChar.style.color = '#ffffff';
                            setTimeout(function() {
                                randomChar.style.color = '#00ff00';
                            }, 200);
                        }
                    }
                });
            }, 100);
        }
        
        function isValidUUID(uuid) {
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            return uuidRegex.test(uuid);
        }
        
        function addTerminalLine(content, type = 'output') {
            const terminalBody = document.getElementById('terminalBody');
            const line = document.createElement('div');
            line.className = 'terminal-line';
            
            const prompt = document.createElement('span');
            prompt.className = 'terminal-prompt';
            prompt.textContent = 'root:~$';
            
            const output = document.createElement('span');
            output.className = 'terminal-' + type;
            output.textContent = content;
            
            line.appendChild(prompt);
            line.appendChild(output);
            terminalBody.appendChild(line);
            
            terminalBody.scrollTop = terminalBody.scrollHeight;
        }
        
        function handleUUIDInput() {
            const input = document.getElementById('uuidInput');
            const uuid = input.value.trim();
            
            if (uuid) {
                addTerminalLine('connect ' + uuid, 'output');
                
                if (isValidUUID(uuid)) {
                    addTerminalLine('正在入侵...', 'output');
                    setTimeout(() => {
                        addTerminalLine('连接成功！返回结果...', 'success');
                        setTimeout(() => {
                            window.location.href = '/' + uuid;
                        }, 1000);
                    }, 500);
                } else {
                    addTerminalLine('错误: 无效的UUID格式', 'error');
                    addTerminalLine('请重新输入有效的UUID', 'output');
                }
                
                input.value = '';
            }
        }
        
        document.addEventListener('DOMContentLoaded', function() {
            createMatrixRain();
            
            const input = document.getElementById('uuidInput');
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    handleUUIDInput();
                }
            });
        });
    </script>
</body>
</html>`;
					return new Response(terminalHtml, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
				}
				if (url.pathname.length > 1 && url.pathname !== '/' && !url.pathname.includes('/sub')) {
					const user = url.pathname.replace(/\/$/, '').substring(1);
					if (isValidFormat(user)) {
						if (user === authToken) {
							return await handleSubscriptionPage(request, user);
						} else {
							return new Response('UUID错误 请注意变量名称是u不是uuid', { status: 403 });
						}
					}
				}
				if (url.pathname.includes('/sub')) {
					const pathParts = url.pathname.split('/');
					if (pathParts.length === 2 && pathParts[1] === 'sub') {
						const user = pathParts[0].substring(1);
						if (isValidFormat(user)) {
							if (user === authToken) {
								return await handleSubscriptionRequest(request, user, url);
							} else {
								return new Response('UUID错误', { status: 403 });
							}
						}
					}
				}
				if (url.pathname.toLowerCase().includes(`/${subPath}`)) {
					return await handleSubscriptionRequest(request, authToken);
				}
			}
			return new Response('Not Found', { status: 404 });
		} catch (err) {
			return new Response(err.toString(), { status: 500 });
		}
	},
};

async function handleSubscriptionRequest(request, user, url = null) {
    if (!url) url = new URL(request.url);
    
    const finalLinks = [];
    const workerDomain = url.hostname;
    const target = url.searchParams.get('target') || 'base64';

    if (currentWorkerRegion === 'CUSTOM') {
        const nativeList = [{ ip: workerDomain, isp: '原生地址' }];
        finalLinks.push(...generateLinksFromSource(nativeList, user, workerDomain));
    } else {
        try {
            const nativeList = [{ ip: workerDomain, isp: '原生地址' }];
            finalLinks.push(...generateLinksFromSource(nativeList, user, workerDomain));
        } catch (error) {
            if (!currentWorkerRegion) {
                currentWorkerRegion = await detectWorkerRegion(request);
            }
            
            const bestBackupIP = await getBestBackupIP(currentWorkerRegion);
            if (bestBackupIP) {
                fallbackAddress = bestBackupIP.domain;
                fallbackPort = bestBackupIP.port.toString();
                const backupList = [{ ip: fallbackAddress, isp: 'ProxyIP-' + currentWorkerRegion }];
                finalLinks.push(...generateLinksFromSource(backupList, user, workerDomain));
            } else {
                const nativeList = [{ ip: workerDomain, isp: '原生地址' }];
                finalLinks.push(...generateLinksFromSource(nativeList, user, workerDomain));
            }
        }
    }

    const hasCustomPreferred = customPreferredIPs.length > 0 || customPreferredDomains.length > 0;
    
    if (disablePreferred) {
    } else if (hasCustomPreferred) {
        if (customPreferredIPs.length > 0) {
            finalLinks.push(...generateLinksFromSource(customPreferredIPs, user, workerDomain));
        }
        
        if (customPreferredDomains.length > 0) {
            const customDomainList = customPreferredDomains.map(d => ({ ip: d.domain, isp: d.name || d.domain }));
            finalLinks.push(...generateLinksFromSource(customDomainList, user, workerDomain));
        }
    } else {
        const domainList = directDomains.map(d => ({ ip: d.domain, isp: d.name || d.domain }));
        finalLinks.push(...generateLinksFromSource(domainList, user, workerDomain));

        try {
            const dynamicIPList = await fetchDynamicIPs();
            if (dynamicIPList.length > 0) {
                finalLinks.push(...generateLinksFromSource(dynamicIPList, user, workerDomain));
            }
        } catch (error) {
            
            if (!currentWorkerRegion) {
                currentWorkerRegion = await detectWorkerRegion(request);
            }
            
            const bestBackupIP = await getBestBackupIP(currentWorkerRegion);
            if (bestBackupIP) {
                fallbackAddress = bestBackupIP.domain;
                fallbackPort = bestBackupIP.port.toString();
                
                const backupList = [{ ip: fallbackAddress, isp: 'ProxyIP-' + currentWorkerRegion }];
                finalLinks.push(...generateLinksFromSource(backupList, user, workerDomain));
            }
        }

        try {
            const newIPList = await fetchAndParseNewIPs();
            if (newIPList.length > 0) {
                finalLinks.push(...generateLinksFromNewIPs(newIPList, user, workerDomain));
            }
        } catch (error) {
            
            if (!currentWorkerRegion) {
                currentWorkerRegion = await detectWorkerRegion(request);
            }
            
            const bestBackupIP = await getBestBackupIP(currentWorkerRegion);
            if (bestBackupIP) {
                fallbackAddress = bestBackupIP.domain;
                fallbackPort = bestBackupIP.port.toString();
                
                const backupList = [{ ip: fallbackAddress, isp: 'ProxyIP-' + currentWorkerRegion }];
                finalLinks.push(...generateLinksFromSource(backupList, user, workerDomain));
            }
        }
    }

    if (finalLinks.length === 0) {
        const errorRemark = "所有节点获取失败";
        const proto = atob('dmxlc3M=');
        const errorLink = `${proto}://00000000-0000-0000-0000-000000000000@127.0.0.1:80?encryption=none&security=none&type=ws&host=error.com&path=%2F#${encodeURIComponent(errorRemark)}`;
        finalLinks.push(errorLink);
    }

    let subscriptionContent;
    let contentType = 'text/plain; charset=utf-8';
    
    switch (target.toLowerCase()) {
        case atob('Y2xhc2g='):
        case atob('Y2xhc2hy'):
            subscriptionContent = await generateClashConfig(finalLinks);
            contentType = 'text/yaml; charset=utf-8';
            break;
        case atob('c3VyZ2Uy'):
        case atob('c3VyZ2Uz'):
        case atob('c3VyZ2U0'):
            subscriptionContent = generateSurgeConfig(finalLinks);
            break;
        case atob('cXVhbnR1bXVsdA=='):
        case atob('cXVhbnR1bXVsdHg='):
            subscriptionContent = generateQuantumultConfig(finalLinks);
            break;
        case atob('c3M='):
        case atob('c3Ny'):
            subscriptionContent = generateSSConfig(finalLinks);
            break;
        case atob('djJyYXk='):
            subscriptionContent = generateV2RayConfig(finalLinks);
            break;
        case atob('bG9vbg=='):
            subscriptionContent = generateLoonConfig(finalLinks);
            break;
        default:
            subscriptionContent = btoa(finalLinks.join('\n'));
    }
    
    return new Response(subscriptionContent, {
        headers: { 
            'Content-Type': contentType,
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
    });
}

function generateLinksFromSource(list, user, workerDomain) {
    const defaultHttpsPorts = [443];
    const defaultHttpPorts = disablePort80 ? [] : [80];
    const links = [];
    const wsPath = encodeURIComponent('/?ed=2048');
    const proto = atob('dmxlc3M=');

    list.forEach(item => {
        const nodeNameBase = item.isp.replace(/\s/g, '_');
        const safeIP = item.ip.includes(':') ? `[${item.ip}]` : item.ip;
        
        let httpsPorts, httpPorts;
        if (item.port) {
            httpsPorts = [item.port];
            httpPorts = disablePort80 && item.port === 80 ? [] : [item.port];
        } else {
            httpsPorts = defaultHttpsPorts;
            httpPorts = defaultHttpPorts;
        }

        httpsPorts.forEach(port => {
            const wsNodeName = `${nodeNameBase}-${port}-WS-TLS`;
            
            const wsParams = new URLSearchParams({ 
                encryption: 'none', 
                security: 'tls', 
                sni: workerDomain, 
                fp: 'randomized', 
                type: 'ws', 
                host: workerDomain, 
                path: wsPath 
            });
            links.push(`${proto}://${user}@${safeIP}:${port}?${wsParams.toString()}#${encodeURIComponent(wsNodeName)}`);
        });

        httpPorts.forEach(port => {
            const wsNodeName = `${nodeNameBase}-${port}-WS`;

            const wsParams = new URLSearchParams({
                encryption: 'none',
                security: 'none',
                type: 'ws',
                host: workerDomain,
                path: wsPath
            });
            links.push(`${proto}://${user}@${safeIP}:${port}?${wsParams.toString()}#${encodeURIComponent(wsNodeName)}`);
        });
    });
    return links;
}

async function fetchDynamicIPs() {
    const v4Url1 = "https://www.wetest.vip/page/cloudflare/address_v4.html";
    const v6Url1 = "https://www.wetest.vip/page/cloudflare/address_v6.html";
    let results = [];

    try {
        const [ipv4List, ipv6List] = await Promise.all([
            fetchAndParseWetest(v4Url1),
            fetchAndParseWetest(v6Url1)
        ]);
        results = [...ipv4List, ...ipv6List];
        if (results.length > 0) {
            return results;
        }
    } catch (e) {
        console.error("Failed to fetch from wetest.vip:", e);
    }

            return [];
        }


async function fetchAndParseWetest(url) {
    try {
        const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (!response.ok) {
            console.error(`Failed to fetch ${url}, status: ${response.status}`);
            return [];
        }
        const html = await response.text();
        const results = [];
        const rowRegex = /<tr[\s\S]*?<\/tr>/g;
        const cellRegex = /<td data-label="线路名称">(.+?)<\/td>[\s\S]*?<td data-label="优选地址">([\d.:a-fA-F]+)<\/td>/;

        let match;
        while ((match = rowRegex.exec(html)) !== null) {
            const rowHtml = match[0];
            const cellMatch = rowHtml.match(cellRegex);
            if (cellMatch && cellMatch[1] && cellMatch[2]) {
                results.push({
                    isp: cellMatch[1].trim().replace(/<.*?>/g, ''),
                    ip: cellMatch[2].trim()
                });
            }
        }
        
        if (results.length === 0) {
            console.warn(`Warning: Could not parse any IPs from ${url}. The site structure might have changed.`);
        }

        return results;
    } catch (error) {
        console.error(`Error parsing ${url}:`, error);
        return [];
    }
}

async function handleWsRequest(request) {
    const wsPair = new WebSocketPair();
    const [clientSock, serverSock] = Object.values(wsPair);
    serverSock.accept();

    let remoteConnWrapper = { socket: null };
    let isDnsQuery = false;

    const earlyData = request.headers.get('sec-websocket-protocol') || '';
    const readable = makeReadableStream(serverSock, earlyData);

    readable.pipeTo(new WritableStream({
        async write(chunk) {
            if (isDnsQuery) return await forwardUDP(chunk, serverSock, null);
            if (remoteConnWrapper.socket) {
                const writer = remoteConnWrapper.socket.writable.getWriter();
                await writer.write(chunk);
                writer.releaseLock();
                return;
            }
            const { hasError, message, addressType, port, hostname, rawIndex, version, isUDP } = parseWsPacketHeader(chunk, authToken);
            if (hasError) throw new Error(message);
            if (isUDP) {
                if (port === 53) isDnsQuery = true;
                else throw new Error(E_UDP_DNS_ONLY);
            }
            const respHeader = new Uint8Array([version[0], 0]);
            const rawData = chunk.slice(rawIndex);
            if (isDnsQuery) return forwardUDP(rawData, serverSock, respHeader);
            await forwardTCP(addressType, hostname, port, rawData, serverSock, respHeader, remoteConnWrapper);
        },
    })).catch((err) => { });

    return new Response(null, { status: 101, webSocket: clientSock });
}

async function forwardTCP(addrType, host, portNum, rawData, ws, respHeader, remoteConnWrapper) {
    async function connectAndSend(address, port, useSocks = false) {
        const remoteSock = useSocks ?
            await establishSocksConnection(addrType, address, port) :
            connect({ hostname: address, port: port });
        const writer = remoteSock.writable.getWriter();
        await writer.write(rawData);
        writer.releaseLock();
        return remoteSock;
    }
    
    async function retryConnection() {
        if (enableSocksDowngrade && isSocksEnabled) {
            try {
                const socksSocket = await connectAndSend(host, portNum, true);
                remoteConnWrapper.socket = socksSocket;
                socksSocket.closed.catch(() => {}).finally(() => closeSocketQuietly(ws));
                connectStreams(socksSocket, ws, respHeader, null);
                return;
            } catch (socksErr) {
                const bestBackupIP = await getBestBackupIP(currentWorkerRegion);
                const backupHost = bestBackupIP ? bestBackupIP.domain : (fallbackAddress || host);
                const backupPort = bestBackupIP ? bestBackupIP.port : (parseInt(fallbackPort, 10) || portNum);
                
                try {
                    const fallbackSocket = await connectAndSend(backupHost, backupPort, false);
                    remoteConnWrapper.socket = fallbackSocket;
                    fallbackSocket.closed.catch(() => {}).finally(() => closeSocketQuietly(ws));
                    connectStreams(fallbackSocket, ws, respHeader, null);
                } catch (fallbackErr) {
                    closeSocketQuietly(ws);
                }
            }
        } else {
            const bestBackupIP = await getBestBackupIP(currentWorkerRegion);
            const backupHost = bestBackupIP ? bestBackupIP.domain : (fallbackAddress || host);
            const backupPort = bestBackupIP ? bestBackupIP.port : (parseInt(fallbackPort, 10) || portNum);
            
            try {
                const fallbackSocket = await connectAndSend(backupHost, backupPort, isSocksEnabled);
                remoteConnWrapper.socket = fallbackSocket;
                fallbackSocket.closed.catch(() => {}).finally(() => closeSocketQuietly(ws));
                connectStreams(fallbackSocket, ws, respHeader, null);
            } catch (fallbackErr) {
                closeSocketQuietly(ws);
            }
        }
    }
    
    try {
        const initialSocket = await connectAndSend(host, portNum, enableSocksDowngrade ? false : isSocksEnabled);
        remoteConnWrapper.socket = initialSocket;
        connectStreams(initialSocket, ws, respHeader, retryConnection);
    } catch (err) {
        retryConnection();
    }
}

function parseWsPacketHeader(chunk, token) {
	if (chunk.byteLength < 24) return { hasError: true, message: E_INVALID_DATA };
	const version = new Uint8Array(chunk.slice(0, 1));
	if (formatIdentifier(new Uint8Array(chunk.slice(1, 17))) !== token) return { hasError: true, message: E_INVALID_USER };
	const optLen = new Uint8Array(chunk.slice(17, 18))[0];
	const cmd = new Uint8Array(chunk.slice(18 + optLen, 19 + optLen))[0];
	let isUDP = false;
	if (cmd === 1) {} else if (cmd === 2) { isUDP = true; } else { return { hasError: true, message: E_UNSUPPORTED_CMD }; }
	const portIdx = 19 + optLen;
	const port = new DataView(chunk.slice(portIdx, portIdx + 2)).getUint16(0);
	let addrIdx = portIdx + 2, addrLen = 0, addrValIdx = addrIdx + 1, hostname = '';
	const addressType = new Uint8Array(chunk.slice(addrIdx, addrValIdx))[0];
	switch (addressType) {
		case ADDRESS_TYPE_IPV4: addrLen = 4; hostname = new Uint8Array(chunk.slice(addrValIdx, addrValIdx + addrLen)).join('.'); break;
		case ADDRESS_TYPE_URL: addrLen = new Uint8Array(chunk.slice(addrValIdx, addrValIdx + 1))[0]; addrValIdx += 1; hostname = new TextDecoder().decode(chunk.slice(addrValIdx, addrValIdx + addrLen)); break;
		case ADDRESS_TYPE_IPV6: addrLen = 16; const ipv6 = []; const ipv6View = new DataView(chunk.slice(addrValIdx, addrValIdx + addrLen)); for (let i = 0; i < 8; i++) ipv6.push(ipv6View.getUint16(i * 2).toString(16)); hostname = ipv6.join(':'); break;
		default: return { hasError: true, message: `${E_INVALID_ADDR_TYPE}: ${addressType}` };
	}
	if (!hostname) return { hasError: true, message: `${E_EMPTY_ADDR}: ${addressType}` };
	return { hasError: false, addressType, port, hostname, isUDP, rawIndex: addrValIdx + addrLen, version };
}

function makeReadableStream(socket, earlyDataHeader) {
	let cancelled = false;
	return new ReadableStream({
		start(controller) {
			socket.addEventListener('message', (event) => { if (!cancelled) controller.enqueue(event.data); });
			socket.addEventListener('close', () => { if (!cancelled) { closeSocketQuietly(socket); controller.close(); } });
			socket.addEventListener('error', (err) => controller.error(err));
			const { earlyData, error } = base64ToArray(earlyDataHeader);
			if (error) controller.error(error); else if (earlyData) controller.enqueue(earlyData);
		},
		cancel() { cancelled = true; closeSocketQuietly(socket); }
	});
}

async function connectStreams(remoteSocket, webSocket, headerData, retryFunc) {
	let header = headerData, hasData = false;
	await remoteSocket.readable.pipeTo(
		new WritableStream({
			async write(chunk, controller) {
				hasData = true;
				if (webSocket.readyState !== 1) controller.error(E_WS_NOT_OPEN);
				if (header) { webSocket.send(await new Blob([header, chunk]).arrayBuffer()); header = null; } 
                else { webSocket.send(chunk); }
			},
			abort(reason) { console.error("Readable aborted:", reason); },
		})
	).catch((error) => { console.error("Stream connection error:", error); closeSocketQuietly(webSocket); });
	if (!hasData && retryFunc) retryFunc();
}

async function forwardUDP(udpChunk, webSocket, respHeader) {
	try {
		const tcpSocket = connect({ hostname: '8.8.4.4', port: 53 });
		let header = respHeader;
		const writer = tcpSocket.writable.getWriter();
		await writer.write(udpChunk);
		writer.releaseLock();
		await tcpSocket.readable.pipeTo(new WritableStream({
			async write(chunk) {
				if (webSocket.readyState === 1) {
					if (header) { webSocket.send(await new Blob([header, chunk]).arrayBuffer()); header = null; } 
                    else { webSocket.send(chunk); }
				}
			},
		}));
	} catch (error) { console.error(`DNS forward error: ${error.message}`); }
}

async function establishSocksConnection(addrType, address, port) {
	const { username, password, hostname, socksPort } = parsedSocks5Config;
	const socket = connect({ hostname, port: socksPort });
	const writer = socket.writable.getWriter();
	await writer.write(new Uint8Array(username ? [5, 2, 0, 2] : [5, 1, 0]));
	const reader = socket.readable.getReader();
	let res = (await reader.read()).value;
	if (res[0] !== 5 || res[1] === 255) throw new Error(E_SOCKS_NO_METHOD);
	if (res[1] === 2) {
		if (!username || !password) throw new Error(E_SOCKS_AUTH_NEEDED);
		const encoder = new TextEncoder();
		const authRequest = new Uint8Array([1, username.length, ...encoder.encode(username), password.length, ...encoder.encode(password)]);
		await writer.write(authRequest);
		res = (await reader.read()).value;
		if (res[0] !== 1 || res[1] !== 0) throw new Error(E_SOCKS_AUTH_FAIL);
	}
	const encoder = new TextEncoder(); let DSTADDR;
	switch (addrType) {
		case ADDRESS_TYPE_IPV4: DSTADDR = new Uint8Array([1, ...address.split('.').map(Number)]); break;
		case ADDRESS_TYPE_URL: DSTADDR = new Uint8Array([3, address.length, ...encoder.encode(address)]); break;
		case ADDRESS_TYPE_IPV6: DSTADDR = new Uint8Array([4, ...address.split(':').flatMap(x => [parseInt(x.slice(0, 2), 16), parseInt(x.slice(2), 16)])]); break;
		default: throw new Error(E_INVALID_ADDR_TYPE);
	}
	await writer.write(new Uint8Array([5, 1, 0, ...DSTADDR, port >> 8, port & 255]));
	res = (await reader.read()).value;
	if (res[1] !== 0) throw new Error(E_SOCKS_CONN_FAIL);
	writer.releaseLock(); reader.releaseLock();
	return socket;
}

function parseSocksConfig(address) {
	let [latter, former] = address.split("@").reverse(); 
	let username, password, hostname, socksPort;
	
	if (former) { 
		const formers = former.split(":"); 
		if (formers.length !== 2) throw new Error(E_INVALID_SOCKS_ADDR);
		[username, password] = formers; 
	}
	
	const latters = latter.split(":"); 
	socksPort = Number(latters.pop()); 
	if (isNaN(socksPort)) throw new Error(E_INVALID_SOCKS_ADDR);
	
	hostname = latters.join(":"); 
	if (hostname.includes(":") && !/^\[.*\]$/.test(hostname)) throw new Error(E_INVALID_SOCKS_ADDR);
	
	return { username, password, hostname, socksPort };
}

async function handleSubscriptionPage(request, user = null) {
	if (!user) user = authToken;
	
	const pageHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>订阅中心</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: "Courier New", monospace;
            background: #000; color: #00ff00; min-height: 100vh;
            overflow-x: hidden; position: relative;
        }
        .matrix-bg {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: linear-gradient(45deg, #000 0%, #001100 50%, #000 100%);
            z-index: -1;
            animation: bg-pulse 8s ease-in-out infinite;
        }
        @keyframes bg-pulse {
            0%, 100% { background: linear-gradient(45deg, #000 0%, #001100 50%, #000 100%); }
            50% { background: linear-gradient(45deg, #000 0%, #002200 50%, #000 100%); }
        }
        .matrix-rain {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.03) 2px, rgba(0,255,0,0.03) 4px);
            animation: matrix-fall 20s linear infinite;
            z-index: -1;
        }
        @keyframes matrix-fall {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(100vh); }
        }
        .matrix-code-rain {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            pointer-events: none; z-index: -1;
            overflow: hidden;
        }
        .matrix-column {
            position: absolute; top: -100%; left: 0;
            color: #00ff00; font-family: "Courier New", monospace;
            font-size: 14px; line-height: 1.2;
            animation: matrix-drop 15s linear infinite;
            text-shadow: 0 0 5px #00ff00;
        }
        @keyframes matrix-drop {
            0% { top: -100%; opacity: 1; }
            10% { opacity: 1; }
            90% { opacity: 0.3; }
            100% { top: 100vh; opacity: 0; }
        }
        .matrix-column:nth-child(odd) {
            animation-duration: 12s;
            animation-delay: -2s;
        }
        .matrix-column:nth-child(even) {
            animation-duration: 18s;
            animation-delay: -5s;
        }
        .matrix-column:nth-child(3n) {
            animation-duration: 20s;
            animation-delay: -8s;
        }
        .container { max-width: 900px; margin: 0 auto; padding: 20px; position: relative; z-index: 1; }
        .header { text-align: center; margin-bottom: 40px; }
        .title {
            font-size: 3.5rem; font-weight: bold;
            text-shadow: 0 0 10px #00ff00, 0 0 20px #00ff00, 0 0 30px #00ff00, 0 0 40px #00ff00;
            margin-bottom: 10px;
            animation: matrix-glow 1.5s ease-in-out infinite alternate, matrix-pulse 3s ease-in-out infinite;
            position: relative;
            background: linear-gradient(45deg, #00ff00, #00aa00, #00ff00);
            background-size: 200% 200%;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        @keyframes matrix-glow {
            from { text-shadow: 0 0 10px #00ff00, 0 0 20px #00ff00, 0 0 30px #00ff00, 0 0 40px #00ff00; }
            to { text-shadow: 0 0 20px #00ff00, 0 0 30px #00ff00, 0 0 40px #00ff00, 0 0 50px #00ff00; }
        }
        @keyframes matrix-pulse {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
        }
        .subtitle { color: #00aa00; margin-bottom: 30px; font-size: 1.2rem; }
        .card {
            background: rgba(0, 20, 0, 0.9);
            border: 2px solid #00ff00;
            border-radius: 0; padding: 30px; margin-bottom: 20px;
            box-shadow: 0 0 30px rgba(0, 255, 0, 0.5), inset 0 0 20px rgba(0, 255, 0, 0.1);
            position: relative;
            backdrop-filter: blur(10px);
            animation: card-glow 4s ease-in-out infinite;
        }
        @keyframes card-glow {
            0%, 100% { box-shadow: 0 0 30px rgba(0, 255, 0, 0.5), inset 0 0 20px rgba(0, 255, 0, 0.1); }
            50% { box-shadow: 0 0 40px rgba(0, 255, 0, 0.7), inset 0 0 30px rgba(0, 255, 0, 0.2); }
        }
        .card::before {
            content: ""; position: absolute; top: 0; left: 0;
            width: 100%; height: 100%;
            background: linear-gradient(45deg, transparent 49%, #00ff00 50%, transparent 51%);
            opacity: 0.2; pointer-events: none;
            animation: scan-line 3s linear infinite;
        }
        @keyframes scan-line {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
        .card-title {
            font-size: 1.8rem; margin-bottom: 20px;
            color: #00ff00; text-shadow: 0 0 5px #00ff00;
        }
        .client-grid {
            display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 15px; margin: 20px 0;
        }
        .client-btn {
            background: rgba(0, 20, 0, 0.8);
            border: 2px solid #00ff00;
            padding: 15px 20px; color: #00ff00;
            font-family: "Courier New", monospace; font-weight: bold;
            cursor: pointer; transition: all 0.4s ease;
            text-align: center; position: relative;
            overflow: hidden;
            text-shadow: 0 0 5px #00ff00;
            box-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
        }
        .client-btn::before {
            content: ""; position: absolute; top: 0; left: -100%;
            width: 100%; height: 100%;
            background: linear-gradient(90deg, transparent, rgba(0,255,0,0.4), transparent);
            transition: left 0.6s ease;
        }
        .client-btn::after {
            content: ""; position: absolute; top: 0; left: 0;
            width: 100%; height: 100%;
            background: linear-gradient(45deg, transparent 30%, rgba(0,255,0,0.1) 50%, transparent 70%);
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        .client-btn:hover::before { left: 100%; }
        .client-btn:hover::after { opacity: 1; }
        .client-btn:hover {
            background: rgba(0, 255, 0, 0.3);
            box-shadow: 0 0 25px #00ff00, 0 0 35px rgba(0, 255, 0, 0.5);
            transform: translateY(-3px) scale(1.05);
            text-shadow: 0 0 10px #00ff00, 0 0 20px #00ff00;
        }
        .generate-btn {
            background: rgba(0, 255, 0, 0.15);
            border: 2px solid #00ff00; padding: 15px 30px;
            color: #00ff00; font-family: "Courier New", monospace;
            font-weight: bold; cursor: pointer;
            transition: all 0.4s ease; margin-right: 15px;
            text-shadow: 0 0 8px #00ff00;
            box-shadow: 0 0 15px rgba(0, 255, 0, 0.4);
            position: relative;
            overflow: hidden;
        }
        .generate-btn::before {
            content: ""; position: absolute; top: 0; left: -100%;
            width: 100%; height: 100%;
            background: linear-gradient(90deg, transparent, rgba(0,255,0,0.5), transparent);
            transition: left 0.8s ease;
        }
        .generate-btn:hover::before { left: 100%; }
        .generate-btn:hover {
            background: rgba(0, 255, 0, 0.4);
            box-shadow: 0 0 30px #00ff00, 0 0 40px rgba(0, 255, 0, 0.6);
            transform: translateY(-4px) scale(1.08);
            text-shadow: 0 0 15px #00ff00, 0 0 25px #00ff00;
        }
        .subscription-url {
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid #00ff00; padding: 15px;
            word-break: break-all; font-family: "Courier New", monospace;
            color: #00ff00; margin-top: 20px; display: none;
            box-shadow: inset 0 0 15px rgba(0, 255, 0, 0.4), 0 0 20px rgba(0, 255, 0, 0.3);
            border-radius: 5px;
            animation: url-glow 2s ease-in-out infinite alternate;
            position: relative;
            overflow: hidden;
        }
        @keyframes url-glow {
            from { box-shadow: inset 0 0 15px rgba(0, 255, 0, 0.4), 0 0 20px rgba(0, 255, 0, 0.3); }
            to { box-shadow: inset 0 0 20px rgba(0, 255, 0, 0.6), 0 0 30px rgba(0, 255, 0, 0.5); }
        }
        .subscription-url::before {
            content: ""; position: absolute; top: 0; left: -100%;
            width: 100%; height: 100%;
            background: linear-gradient(90deg, transparent, rgba(0,255,0,0.1), transparent);
            animation: url-scan 3s linear infinite;
        }
        @keyframes url-scan {
            0% { left: -100%; }
            100% { left: 100%; }
        }
        .matrix-text {
            position: fixed; top: 20px; right: 20px;
            color: #00ff00; font-family: "Courier New", monospace;
            font-size: 0.8rem; opacity: 0.6;
            animation: matrix-flicker 3s infinite;
        }
        @keyframes matrix-flicker {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
        }
    </style>
</head>
<body>
    <div class="matrix-bg"></div>
    <div class="matrix-rain"></div>
    <div class="matrix-code-rain" id="matrixCodeRain"></div>
    <div class="matrix-text">代理订阅中心 v1.1</div>
    <div class="container">
        <div class="header">
            <h1 class="title">代理订阅中心</h1>
            <p class="subtitle">多客户端支持 • 智能优选 • 一键生成</p>
        </div>
        <div class="card">
            <h2 class="card-title">[ 选择客户端 ]</h2>
            <div class="client-grid">
                <button class="client-btn" onclick="generateClientLink(atob('Y2xhc2g='))">CLASH</button>
                <button class="client-btn" onclick="generateClientLink(atob('c3VyZ2U='))">SURGE</button>
                <button class="client-btn" onclick="generateClientLink(atob('c2luZ2JveA=='))">SING-BOX</button>
                <button class="client-btn" onclick="generateClientLink(atob('bG9vbg=='))">LOON</button>
                <button class="client-btn" onclick="generateClientLink(atob('djJyYXk='))">V2RAY</button>
            </div>
            <div class="subscription-url" id="clientSubscriptionUrl"></div>
        </div>
        <div class="card">
            <h2 class="card-title">[ 快速获取 ]</h2>
            <button class="generate-btn" onclick="getBase64Subscription()">获取订阅链接</button>
            <div class="subscription-url" id="base64SubscriptionUrl"></div>
        </div>
        <div class="card">
            <h2 class="card-title">[ 系统状态 ]</h2>
            <div id="systemStatus" style="margin: 20px 0; padding: 15px; background: rgba(0, 20, 0, 0.8); border: 2px solid #00ff00; box-shadow: 0 0 20px rgba(0, 255, 0, 0.3), inset 0 0 15px rgba(0, 255, 0, 0.1); position: relative; overflow: hidden;">
                <div style="color: #00ff00; margin-bottom: 15px; font-weight: bold; text-shadow: 0 0 5px #00ff00;">[ 系统检测中... ]</div>
                <div id="regionStatus" style="margin: 8px 0; color: #00ff00; font-family: 'Courier New', monospace; text-shadow: 0 0 3px #00ff00;">Worker地区: 检测中...</div>
                <div id="geoInfo" style="margin: 8px 0; color: #00aa00; font-family: 'Courier New', monospace; font-size: 0.9rem; text-shadow: 0 0 3px #00aa00;">检测方式: 检测中...</div>
                <div id="backupStatus" style="margin: 8px 0; color: #00ff00; font-family: 'Courier New', monospace; text-shadow: 0 0 3px #00ff00;">ProxyIP状态: 检测中...</div>
                <div id="currentIP" style="margin: 8px 0; color: #00ff00; font-family: 'Courier New', monospace; text-shadow: 0 0 3px #00ff00;">当前使用IP: 检测中...</div>
                <div id="regionMatch" style="margin: 8px 0; color: #00ff00; font-family: 'Courier New', monospace; text-shadow: 0 0 3px #00ff00;">地区匹配: 检测中...</div>
                <div id="selectionLogic" style="margin: 8px 0; color: #00aa00; font-family: 'Courier New', monospace; font-size: 0.9rem; text-shadow: 0 0 3px #00aa00;">选择逻辑: 同地区 → 邻近地区 → 其他地区</div>
            </div>
        </div>
        <div class="card">
            <h2 class="card-title">[ 相关链接 ]</h2>
            <div style="text-align: center; margin: 20px 0;">
                <a href="https://github.com/byJoey/cfnew" target="_blank" style="color: #00ff00; text-decoration: none; margin: 0 20px; font-size: 1.2rem; text-shadow: 0 0 5px #00ff00;">GitHub 项目</a>
                <a href="https://www.youtube.com/@joeyblog" target="_blank" style="color: #00ff00; text-decoration: none; margin: 0 20px; font-size: 1.2rem; text-shadow: 0 0 5px #00ff00;">YouTube @joeyblog</a>
            </div>
        </div>
    </div>
    <script>
        function generateClientLink(clientType) {
            var currentUrl = window.location.href;
            var subscriptionUrl = currentUrl + "/sub";
            
            if (clientType === atob('djJyYXk=')) {
                document.getElementById("clientSubscriptionUrl").textContent = subscriptionUrl;
                document.getElementById("clientSubscriptionUrl").style.display = "block";
                navigator.clipboard.writeText(subscriptionUrl).then(function() {
                    alert("V2Ray 订阅链接已复制");
                });
            } else {
                var encodedUrl = encodeURIComponent(subscriptionUrl);
                var apiUrl = "https://s.jhb.edu.kg/sub?target=" + clientType + "&url=" + encodedUrl + "&insert=false";
                document.getElementById("clientSubscriptionUrl").textContent = apiUrl;
                document.getElementById("clientSubscriptionUrl").style.display = "block";
                navigator.clipboard.writeText(apiUrl).then(function() {
                    var displayName = clientType.toUpperCase();
                    if (clientType === atob('c3VyZ2U=')) displayName = 'SURGE';
                    if (clientType === atob('c2luZ2JveA==')) displayName = 'SING-BOX';
                    alert(displayName + " 订阅链接已复制");
                });
            }
        }
        function getBase64Subscription() {
            var currentUrl = window.location.href;
            var subscriptionUrl = currentUrl + "/sub";
            
            fetch(subscriptionUrl)
                .then(function(response) {
                    return response.text();
                })
                .then(function(base64Content) {
                    document.getElementById("base64SubscriptionUrl").textContent = base64Content;
                    document.getElementById("base64SubscriptionUrl").style.display = "block";
                    navigator.clipboard.writeText(base64Content).then(function() {
                        alert("Base64订阅内容已复制");
                    });
                })
                .catch(function(error) {
                    console.error("获取订阅失败:", error);
                    alert("获取订阅失败，请重试");
                });
        }
        
        function createMatrixRain() {
            const matrixContainer = document.getElementById('matrixCodeRain');
            const matrixChars = '01ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
            const columns = Math.floor(window.innerWidth / 18);
            
            for (let i = 0; i < columns; i++) {
                const column = document.createElement('div');
                column.className = 'matrix-column';
                column.style.left = (i * 18) + 'px';
                column.style.animationDelay = Math.random() * 15 + 's';
                column.style.animationDuration = (Math.random() * 15 + 8) + 's';
                column.style.fontSize = (Math.random() * 4 + 12) + 'px';
                column.style.opacity = Math.random() * 0.8 + 0.2;
                
                let text = '';
                const charCount = Math.floor(Math.random() * 30 + 20);
                for (let j = 0; j < charCount; j++) {
                    const char = matrixChars[Math.floor(Math.random() * matrixChars.length)];
                    const brightness = Math.random() > 0.1 ? '#00ff00' : '#00aa00';
                    text += '<span style="color: ' + brightness + ';">' + char + '</span><br>';
                }
                column.innerHTML = text;
                matrixContainer.appendChild(column);
            }
            
            setInterval(function() {
                const columns = matrixContainer.querySelectorAll('.matrix-column');
                columns.forEach(function(column) {
                    if (Math.random() > 0.95) {
                        const chars = column.querySelectorAll('span');
                        if (chars.length > 0) {
                            const randomChar = chars[Math.floor(Math.random() * chars.length)];
                            randomChar.style.color = '#ffffff';
                            setTimeout(function() {
                                randomChar.style.color = '#00ff00';
                            }, 200);
                        }
                    }
                });
            }, 100);
        }
        
        async function checkSystemStatus() {
            try {
                const cfStatus = document.getElementById('cfStatus');
                const regionStatus = document.getElementById('regionStatus');
                const geoInfo = document.getElementById('geoInfo');
                const backupStatus = document.getElementById('backupStatus');
                const currentIP = document.getElementById('currentIP');
                const regionMatch = document.getElementById('regionMatch');
                
                const regionNames = {
                    'US': '🇺🇸 美国', 'SG': '🇸🇬 新加坡', 'JP': '🇯🇵 日本', 'HK': '🇭🇰 香港',
                    'KR': '🇰🇷 韩国', 'DE': '🇩🇪 德国', 'SE': '🇸🇪 瑞典', 'NL': '🇳🇱 荷兰',
                    'FI': '🇫🇮 芬兰', 'GB': '🇬🇧 英国'
                };
                
                let detectedRegion = 'US'; // 默认值
                let isCustomIPMode = false;
                try {
                    const response = await fetch('/region');
                    const data = await response.json();
                    
                    
                    if (data.region === 'CUSTOM') {
                        isCustomIPMode = true;
                        detectedRegion = 'CUSTOM';
                        
                        if (backupStatus) backupStatus.style.display = 'none';
                        if (currentIP) currentIP.style.display = 'none';
                        if (regionMatch) regionMatch.style.display = 'none';
                        
                        geoInfo.innerHTML = '检测方式: <span style="color: #ffaa00;">自定义IP模式</span>';
                        regionStatus.innerHTML = 'Worker地区: <span style="color: #ffaa00;">🔧 自定义IP模式</span>';
                        
                        return; // 提前返回，不执行后续的地区匹配逻辑
                    } else if (data.region && regionNames[data.region]) {
                        detectedRegion = data.region;
                    }
                    
                    geoInfo.innerHTML = '检测方式: <span style="color: #44ff44;">API地理位置检测</span>';
                    
                } catch (e) {
                    geoInfo.innerHTML = '检测方式: <span style="color: #ff4444;">检测失败</span>';
                }
                
                regionStatus.innerHTML = 'Worker地区: <span style="color: #44ff44;">✅ ' + regionNames[detectedRegion] + '</span>';
                
                const backupIPs = [
                    { domain: 'ProxyIP.US.CMLiussss.net', region: 'US' },
                    { domain: 'ProxyIP.SG.CMLiussss.net', region: 'SG' },
                    { domain: 'ProxyIP.JP.CMLiussss.net', region: 'JP' },
                    { domain: 'ProxyIP.HK.CMLiussss.net', region: 'HK' },
                    { domain: 'ProxyIP.KR.CMLiussss.net', region: 'KR' },
                    { domain: 'ProxyIP.DE.CMLiussss.net', region: 'DE' },
                    { domain: 'ProxyIP.SE.CMLiussss.net', region: 'SE' },
                    { domain: 'ProxyIP.NL.CMLiussss.net', region: 'NL' },
                    { domain: 'ProxyIP.FI.CMLiussss.net', region: 'FI' },
                    { domain: 'ProxyIP.GB.CMLiussss.net', region: 'GB' }
                ];
                
                let availableCount = 0;
                let sameRegionAvailable = 0;
                let nearbyRegionAvailable = 0;
                
                const nearbyRegions = {
                    'US': ['SG', 'JP', 'HK', 'KR'],
                    'SG': ['JP', 'HK', 'KR', 'US'],
                    'JP': ['SG', 'HK', 'KR', 'US'],
                    'HK': ['SG', 'JP', 'KR', 'US'],
                    'KR': ['JP', 'HK', 'SG', 'US'],
                    'DE': ['NL', 'GB', 'SE', 'FI'],
                    'SE': ['DE', 'NL', 'FI', 'GB'],
                    'NL': ['DE', 'GB', 'SE', 'FI'],
                    'FI': ['SE', 'DE', 'NL', 'GB'],
                    'GB': ['DE', 'NL', 'SE', 'FI']
                };
                
                for (const ip of backupIPs) {
                    availableCount++;
                    if (ip.region === detectedRegion) {
                        sameRegionAvailable++;
                    } else if (nearbyRegions[detectedRegion] && nearbyRegions[detectedRegion].includes(ip.region)) {
                        nearbyRegionAvailable++;
                    }
                }
                
                backupStatus.innerHTML = 'ProxyIP状态: <span style="color: #44ff44;">✅ ' + availableCount + '/' + backupIPs.length + ' 可用</span> <span style="color: #00aa00; font-size: 0.8rem;">(ProxyIP域名预设可用)</span>';
                currentIP.innerHTML = '当前使用IP: <span style="color: #44ff44;">✅ 智能就近选择中</span>';
                
                if (sameRegionAvailable > 0) {
                    regionMatch.innerHTML = '地区匹配: <span style="color: #44ff44;">✅ 同地区IP可用 (' + sameRegionAvailable + '个)</span>';
                } else if (nearbyRegionAvailable > 0) {
                    regionMatch.innerHTML = '地区匹配: <span style="color: #ffaa00;">🔄 使用邻近地区IP (' + nearbyRegionAvailable + '个)</span>';
                } else {
                    regionMatch.innerHTML = '地区匹配: <span style="color: #ffaa00;">⚠️ 将使用其他地区IP</span>';
                }
                
            } catch (error) {
                console.error('状态检测失败:', error);
                document.getElementById('regionStatus').innerHTML = 'Worker地区: <span style="color: #ff4444;">❌ 检测失败</span>';
                document.getElementById('geoInfo').innerHTML = '地理位置: <span style="color: #ff4444;">❌ 检测失败</span>';
                document.getElementById('backupStatus').innerHTML = 'ProxyIP状态: <span style="color: #ff4444;">❌ 检测失败</span>';
                document.getElementById('currentIP').innerHTML = '当前使用IP: <span style="color: #ff4444;">❌ 检测失败</span>';
                document.getElementById('regionMatch').innerHTML = '地区匹配: <span style="color: #ff4444;">❌ 检测失败</span>';
            }
        }
        
        async function testAPI() {
            try {
                const response = await fetch('/test-api');
                const data = await response.json();
                
                
                if (data.detectedRegion) {
                    alert('API检测结果: ' + data.detectedRegion + '\\n检测时间: ' + data.timestamp);
                } else {
                    alert('API检测失败: ' + (data.error || '未知错误'));
                }
            } catch (error) {
                console.error('API测试失败:', error);
                alert('API测试失败: ' + error.message);
            }
        }
        
        async function testIPAPI() {
            try {
                const response = await fetch('/test-ip-api');
                const data = await response.json();
                
                
                if (data.apiResponse) {
                    const apiData = data.apiResponse;
                    let message = '双重API响应:\\n';
                    message += 'Worker IP (itdog.plus): ' + (data.workerIP || '未知') + '\\n';
                    message += '用户IP (joeyblog.net): ' + (apiData.user_ip || '未知') + '\\n';
                    message += '国家: ' + (apiData.user_country || '未知') + '\\n';
                    message += '国家代码: ' + (apiData.user_country_code || '未知') + '\\n';
                    message += '城市: ' + (apiData.user_city || '未知') + '\\n';
                    message += '组织: ' + (apiData.user_org || '未知');
                    alert(message);
                } else {
                    alert('双重API测试失败: ' + (data.error || '未知错误'));
                }
            } catch (error) {
                console.error('双重API测试失败:', error);
                alert('双重API测试失败: ' + error.message);
            }
        }
        
        document.addEventListener('DOMContentLoaded', function() {
            createMatrixRain();
            checkSystemStatus();
        });
    </script>
</body>
</html>`;
	
	return new Response(pageHtml, { 
		status: 200, 
		headers: { 'Content-Type': 'text/html; charset=utf-8' } 
	});
}

function base64ToArray(b64Str) {
	if (!b64Str) return { error: null };
	try { b64Str = b64Str.replace(/-/g, '+').replace(/_/g, '/'); return { earlyData: Uint8Array.from(atob(b64Str), (c) => c.charCodeAt(0)).buffer, error: null }; } 
    catch (error) { return { error }; }
}

function closeSocketQuietly(socket) { try { if (socket.readyState === 1 || socket.readyState === 2) socket.close(); } catch (error) {} }

const hexTable = Array.from({ length: 256 }, (v, i) => (i + 256).toString(16).slice(1));
function formatIdentifier(arr, offset = 0) {
	const id = (hexTable[arr[offset]]+hexTable[arr[offset+1]]+hexTable[arr[offset+2]]+hexTable[arr[offset+3]]+"-"+hexTable[arr[offset+4]]+hexTable[arr[offset+5]]+"-"+hexTable[arr[offset+6]]+hexTable[arr[offset+7]]+"-"+hexTable[arr[offset+8]]+hexTable[arr[offset+9]]+"-"+hexTable[arr[offset+10]]+hexTable[arr[offset+11]]+hexTable[arr[offset+12]]+hexTable[arr[offset+13]]+hexTable[arr[offset+14]]+hexTable[arr[offset+15]]).toLowerCase();
	if (!isValidFormat(id)) throw new TypeError(E_INVALID_ID_STR);
	return id;
}

async function fetchAndParseNewIPs() {
    const url = "https://raw.githubusercontent.com/qwer-search/bestip/refs/heads/main/kejilandbestip.txt";
    try {
        const response = await fetch(url);
        if (!response.ok) return [];
        const text = await response.text();
        const results = [];
        const lines = text.trim().replace(/\r/g, "").split('\n');
        const regex = /^([^:]+):(\d+)#(.*)$/;

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;
            const match = trimmedLine.match(regex);
            if (match) {
                results.push({
                    ip: match[1],
                    port: parseInt(match[2], 10),
                    name: match[3].trim() || match[1]
                });
            }
        }
        return results;
    } catch (error) {
        return [];
    }
}

function generateLinksFromNewIPs(list, user, workerDomain) {
    const links = [];
    const wsPath = encodeURIComponent('/?ed=2048');
    const proto = atob('dmxlc3M=');
    
    list.forEach(item => {
        const nodeName = item.name.replace(/\s/g, '_');
        const link = `${proto}://${user}@${item.ip}:${item.port}?encryption=none&security=tls&type=ws&host=${workerDomain}&path=${wsPath}#${encodeURIComponent(nodeName)}`;
        links.push(link);
    });
    return links;
}