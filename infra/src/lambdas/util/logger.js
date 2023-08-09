"use strict";
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.LogLevel = void 0;
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["none"] = 0] = "none";
    LogLevel[LogLevel["error"] = 10] = "error";
    LogLevel[LogLevel["warn"] = 20] = "warn";
    LogLevel[LogLevel["info"] = 30] = "info";
    LogLevel[LogLevel["debug"] = 40] = "debug";
})(LogLevel = exports.LogLevel || (exports.LogLevel = {}));
class Logger {
    constructor(logLevel) {
        this.logLevel = logLevel;
    }
    jsonify(args) {
        return args.map((arg) => {
            if (typeof arg === "object") {
                try {
                    return JSON.stringify(arg);
                }
                catch {
                    return arg;
                }
            }
            return arg;
        });
    }
    info(...args) {
        if (this.logLevel >= LogLevel.info) {
            console.log(...this.jsonify(args));
        }
    }
    warn(...args) {
        if (this.logLevel >= LogLevel.warn) {
            console.warn(...this.jsonify(args));
        }
    }
    error(...args) {
        if (this.logLevel >= LogLevel.error) {
            console.error(...this.jsonify(args));
        }
    }
    debug(...args) {
        if (this.logLevel >= LogLevel.debug) {
            console.trace(...this.jsonify(args));
        }
    }
}
exports.Logger = Logger;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibG9nZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSwwREFBMEQ7QUFDMUQsd0RBQXdEO0FBQ3hELHVEQUF1RDtBQUN2RCxzRUFBc0U7OztBQUV0RSxJQUFZLFFBTVg7QUFORCxXQUFZLFFBQVE7SUFDbEIsdUNBQVUsQ0FBQTtJQUNWLDBDQUFZLENBQUE7SUFDWix3Q0FBVyxDQUFBO0lBQ1gsd0NBQVcsQ0FBQTtJQUNYLDBDQUFZLENBQUE7QUFDZCxDQUFDLEVBTlcsUUFBUSxHQUFSLGdCQUFRLEtBQVIsZ0JBQVEsUUFNbkI7QUFFRCxNQUFhLE1BQU07SUFDakIsWUFBb0IsUUFBa0I7UUFBbEIsYUFBUSxHQUFSLFFBQVEsQ0FBVTtJQUFHLENBQUM7SUFFbEMsT0FBTyxDQUFDLElBQVc7UUFDekIsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBUSxFQUFPLEVBQUU7WUFDaEMsSUFBSSxPQUFPLEdBQUcsS0FBSyxRQUFRLEVBQUU7Z0JBQzNCLElBQUk7b0JBQ0YsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFBO2lCQUMzQjtnQkFBQyxNQUFNO29CQUNOLE9BQU8sR0FBRyxDQUFBO2lCQUNYO2FBQ0Y7WUFDRCxPQUFPLEdBQUcsQ0FBQTtRQUNaLENBQUMsQ0FBQyxDQUFBO0lBQ0osQ0FBQztJQUNNLElBQUksQ0FBQyxHQUFHLElBQVM7UUFDdEIsSUFBSSxJQUFJLENBQUMsUUFBUSxJQUFJLFFBQVEsQ0FBQyxJQUFJLEVBQUU7WUFDbEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQTtTQUNuQztJQUNILENBQUM7SUFDTSxJQUFJLENBQUMsR0FBRyxJQUFTO1FBQ3RCLElBQUksSUFBSSxDQUFDLFFBQVEsSUFBSSxRQUFRLENBQUMsSUFBSSxFQUFFO1lBQ2xDLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUE7U0FDcEM7SUFDSCxDQUFDO0lBQ00sS0FBSyxDQUFDLEdBQUcsSUFBUztRQUN2QixJQUFJLElBQUksQ0FBQyxRQUFRLElBQUksUUFBUSxDQUFDLEtBQUssRUFBRTtZQUNuQyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFBO1NBQ3JDO0lBQ0gsQ0FBQztJQUNNLEtBQUssQ0FBQyxHQUFHLElBQVM7UUFDdkIsSUFBSSxJQUFJLENBQUMsUUFBUSxJQUFJLFFBQVEsQ0FBQyxLQUFLLEVBQUU7WUFDbkMsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQTtTQUNyQztJQUNILENBQUM7Q0FDRjtBQW5DRCx3QkFtQ0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdW5zYWZlLWFyZ3VtZW50ICovXG4vKiBlc2xpbnQtZGlzYWJsZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdW5zYWZlLXJldHVybiAqL1xuLyogZXNsaW50LWRpc2FibGUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueSAqL1xuLyogZXNsaW50LWRpc2FibGUgQHR5cGVzY3JpcHQtZXNsaW50L2V4cGxpY2l0LW1vZHVsZS1ib3VuZGFyeS10eXBlcyAqL1xuXG5leHBvcnQgZW51bSBMb2dMZXZlbCB7XG4gIFwibm9uZVwiID0gMCxcbiAgXCJlcnJvclwiID0gMTAsXG4gIFwid2FyblwiID0gMjAsXG4gIFwiaW5mb1wiID0gMzAsXG4gIFwiZGVidWdcIiA9IDQwLFxufVxuXG5leHBvcnQgY2xhc3MgTG9nZ2VyIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBsb2dMZXZlbDogTG9nTGV2ZWwpIHt9XG5cbiAgcHJpdmF0ZSBqc29uaWZ5KGFyZ3M6IGFueVtdKSB7XG4gICAgcmV0dXJuIGFyZ3MubWFwKChhcmc6IGFueSk6IGFueSA9PiB7XG4gICAgICBpZiAodHlwZW9mIGFyZyA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShhcmcpXG4gICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgIHJldHVybiBhcmdcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGFyZ1xuICAgIH0pXG4gIH1cbiAgcHVibGljIGluZm8oLi4uYXJnczogYW55KTogdm9pZCB7XG4gICAgaWYgKHRoaXMubG9nTGV2ZWwgPj0gTG9nTGV2ZWwuaW5mbykge1xuICAgICAgY29uc29sZS5sb2coLi4udGhpcy5qc29uaWZ5KGFyZ3MpKVxuICAgIH1cbiAgfVxuICBwdWJsaWMgd2FybiguLi5hcmdzOiBhbnkpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5sb2dMZXZlbCA+PSBMb2dMZXZlbC53YXJuKSB7XG4gICAgICBjb25zb2xlLndhcm4oLi4udGhpcy5qc29uaWZ5KGFyZ3MpKVxuICAgIH1cbiAgfVxuICBwdWJsaWMgZXJyb3IoLi4uYXJnczogYW55KTogdm9pZCB7XG4gICAgaWYgKHRoaXMubG9nTGV2ZWwgPj0gTG9nTGV2ZWwuZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoLi4udGhpcy5qc29uaWZ5KGFyZ3MpKVxuICAgIH1cbiAgfVxuICBwdWJsaWMgZGVidWcoLi4uYXJnczogYW55KTogdm9pZCB7XG4gICAgaWYgKHRoaXMubG9nTGV2ZWwgPj0gTG9nTGV2ZWwuZGVidWcpIHtcbiAgICAgIGNvbnNvbGUudHJhY2UoLi4udGhpcy5qc29uaWZ5KGFyZ3MpKVxuICAgIH1cbiAgfVxufSJdfQ==