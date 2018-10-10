import remove from "just-remove";

export let LoginStatusEnum = {
    NotLoggedIn: 0,
    LoggingIn: 1,
    LoggedIn: 2,
    LoggedInFailed: 3,
};

const LoginStatusPrivate = {
    status: Symbol('status'),
    callbacks: Symbol('callbacks')
}
export class LoginStatus {
    constructor() {
        this[LoginStatusPrivate.status] = LoginStatusEnum.NotLoggedIn;
        this[LoginStatusPrivate.callbacks] = [];
    }

    get status() {
        return this[LoginStatusPrivate.status];
    }

    subscribeStatusChanged(callback) {
        this[LoginStatusPrivate.callbacks].push(callback);
        return {
            unSubscribe() {
                remove(this[LoginStatusPrivate.callbacks], callback);
            }
        }
    }

    cleanSubscription() {
        this[LoginStatusPrivate.callbacks].length = 0;
    }

    changeStatus(status) {
        let oldStatus = this[LoginStatusPrivate.status];
        if (oldStatus == status) {
            return;
        }

        this[LoginStatusPrivate.status] = status;
        this[LoginStatusPrivate.callbacks].forEach(item => {
            try {
                item(oldStatus, status);
            } catch (e) {
                console.log(e);
            }
        });
    }
}