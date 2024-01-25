import {toast,Flip} from "react-toastify";

const ToastMessage = (type, message)=>{
    return toast(message, {
        type,
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
        transition:Flip,
    })
}


export default ToastMessage