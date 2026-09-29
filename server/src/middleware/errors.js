export function errors(err,req,res,_next){const message=err.message||'Unexpected error'; const status=err.status||400; res.status(status).json({error:{code:err.code||'VALIDATION_ERROR',message}});}
