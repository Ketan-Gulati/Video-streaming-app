//const asyncHandler = ()=>{}
//const asyncHandler = ()=>{ ()=>{} }
//const asyncHasndler = ()=>{ async()=>{} }  or ()=>async()=>{}


//approach-1:-

// const asynHandler = (fn)=>async (req,res,next)=>{    // higher order function
//     try {
//         await fn(req,res,next);
//     } catch (error) {
//         res.status(error.codde || 500)
//            .json({
//             success : false,
//             message : error.message
//            })
//     }
// }


//approach-2:-

const asyncHandler = (requestHandler)=>{
    return (req,res,next)=>{  //Higher order function
            Promise.resolve(requestHandler(req,res,next))
            .catch((err)=>next(err))
}}

export { asyncHandler }