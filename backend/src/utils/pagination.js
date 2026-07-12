const getPagination = (page = 1, limit = 10) => {
  const safePage = Number(page) > 0 ? Number(page) : 1;
  const safeLimit = Number(limit) > 0 ? Number(limit) : 10;

  return {
    skip: (safePage - 1) * safeLimit,
    take: safeLimit,
    page: safePage,
    limit: safeLimit,
  };
};

module.exports = {
  getPagination,
};
