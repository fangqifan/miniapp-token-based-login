import { LoginStatus, LoginStatusEnum } from "./loginStatus";
import extend from 'just-extend';

const defaultOptions = {
    loginTokenStorageName: 'login-token',
    thirdPartyLoginRequest: async function() {
        return await Promise.resolve('');
    }
};

const privateNames = {
    loginStatus: Symbol('loginStatus'),
    options: Symbol('options'),
};

export class LoginModule {
    constructor(options) {
        this[privateNames.options] = extend(true, {}, defaultOptions, options);
        this[privateNames.loginStatus] = new LoginStatus();
    }

    get status() {
        return this[privateNames.loginStatus];
    }

    get loginToken() {
        return wx.getStorageSync(this[privateNames.options].loginTokenStorageName)
    }

    async login() {
        if (this.status.status === LoginStatusEnum.LoggingIn) {
            let self=this;
            await new Promise((resolve) => {
                let token = self.status.subscribeStatusChanged((oldStatus) => {
                    if (oldStatus == LoginStatusEnum.LoggingIn) {
                        token.unSubscribe();
                        resolve();
                    }
                });
            });
            return;
        }
        try {
            this.status.changeStatus(LoginStatusEnum.LoggingIn);

            const code = await new Promise(function (resolve, reject) {
                wx.login({
                    success: (res) => {
                        res.code ? resolve(res.code) : reject();
                    },
                    fail: reject,
                });
            });
            // 发起第三方登录
            let newLoginToken = this[privateNames.options].thirdPartyLoginRequest(code);
            if (!newLoginToken) {
                this.status.changeStatus(LoginStatusEnum.NotLoggedIn);
                return;
            }
            // 接收并存储第三方登录态
            wx.setStorageSync(this[privateNames.options].loginTokenStorageName, newLoginToken);

            this.status.changeStatus(LoginStatusEnum.LoggedIn);
        }
        catch (e) {
            this.status.changeStatus(LoginStatusEnum.NotLoggedIn);
            throw e;
        }
    }
}