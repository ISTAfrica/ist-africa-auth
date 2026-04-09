import { Request } from 'express';
import { UAParser } from 'ua-parser-js';
import { DeviceInfo } from './token';

export function extractDeviceInfo(req: Request): DeviceInfo {
  const ua = req.headers['user-agent'] || '';
  const parser = new UAParser(ua);
  const browser = parser.getBrowser();
  const os = parser.getOS();
  const device = parser.getDevice();

  const browserName = [browser.name, browser.version?.split('.')[0]]
    .filter(Boolean)
    .join(' ');

  const osName = [os.name, os.version]
    .filter(Boolean)
    .join(' ');

  const ipAddress =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.ip ||
    null;

  return {
    browser: browserName || null,
    os: osName || null,
    deviceType: device.type || 'desktop',
    ipAddress,
  };
}
