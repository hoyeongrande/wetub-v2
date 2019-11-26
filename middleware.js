import routes from "./routes";

export const localsMiddleware = (req, res, next) => {
    res.locals.siteName = "Wetub";
    res.locals.routes = routes;
    next();
};