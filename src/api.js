export const emailPost=async(data)=>{
    try{
        let res=await fetch(`https://email-verifier-backend-5xc2.onrender.com/api/emails/verify-bulk`,{
            method:"POST",
            mode:"cors",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify(data)
        })
        let result=await res.json()
        return result
    }catch(err){
        console.log(err)
    }
}


export const emailGetAll=async()=>{
    try{
        let res=await fetch(`https://email-verifier-backend-5xc2.onrender.com/api/emails/getAllEmails`,{
            method:"GET",
            mode:"cors",
            headers:{
                "Content-Type":"application/json"
            },
            //  body:JSON.stringify(data)
        })
        let result=await res.json()
        return result
    }catch(err){
        console.log(err)
    }
}

export const emaildeleteAll=async()=>{
    try{
        let res=await fetch(`https://email-verifier-backend-5xc2.onrender.com/api/emails/deleteAllEmails`,{
            method:"DELETE",
            mode:"cors",
            headers:{
                "Content-Type":"application/json"
            },
        })
        let result=await res.json()
        return result
    }catch(err){
        console.log(err)
    }
}
