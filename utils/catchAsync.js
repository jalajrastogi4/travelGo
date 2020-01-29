module.exports = fn => {
  return (req, res, next) => {
    // fn(req, res, next).catch(err => next(err))
    // ES6 version is like below both mean same
    fn(req, res, next).catch(next);
  };
};
