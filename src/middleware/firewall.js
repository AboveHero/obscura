const ipRangeCheck = require("ip-range-check");

class Firewall {
    constructor(options = {}) {
        this.allowedCidrs = options.CIDR || ["127.0.0.1", "::1"];
    }

    middleware() {
        return (req, res, next) => {
            let ip = req.ip || "";
            if (ip.startsWith("::ffff:")) {
                ip = ip.replace("::ffff:", "");
            }

            if (ipRangeCheck(ip, this.allowedCidrs)) {
                return next();
            }

            console.log(`🚨 Blocked IP: ${req.ip} - ${req.method.toUpperCase()} ${req.originalUrl}`);
            return res.status(403).json({ error: "Forbidden" });
        };
    }
}

module.exports = Firewall;