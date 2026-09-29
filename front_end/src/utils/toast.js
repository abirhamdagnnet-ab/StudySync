import toast from "react-hot-toast";

const notifySuccess = (message, options) => toast.success(message, options);
const notifyError = (message, options) => toast.error(message, options);
const notifyPromise = (promise, messages, options) => toast.promise(promise, messages, options);

export { notifySuccess, notifyError, notifyPromise };