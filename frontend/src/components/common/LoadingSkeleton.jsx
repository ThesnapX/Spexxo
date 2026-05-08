const LoadingSkeleton = ({ type = "product", count = 4 }) => {
  const ProductSkeleton = () => (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="h-56 md:h-64 bg-gray-200" />
      <div className="p-4 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-1/3" />
      </div>
    </div>
  );

  const CategorySkeleton = () => (
    <div className="rounded-2xl overflow-hidden animate-pulse bg-gray-200 aspect-square" />
  );

  const BannerSkeleton = () => (
    <div className="rounded-2xl overflow-hidden animate-pulse bg-gray-200 h-40 md:h-48" />
  );

  const HeroSkeleton = () => (
    <div className="rounded-3xl overflow-hidden animate-pulse bg-gray-200 h-[300px] md:h-[500px] w-full" />
  );

  const renderSkeleton = () => {
    switch (type) {
      case "product":
        return <ProductSkeleton />;
      case "category":
        return <CategorySkeleton />;
      case "banner":
        return <BannerSkeleton />;
      case "hero":
        return <HeroSkeleton />;
      default:
        return <ProductSkeleton />;
    }
  };

  return (
    <>
      {[...Array(count)].map((_, i) => (
        <div key={i}>{renderSkeleton()}</div>
      ))}
    </>
  );
};

export default LoadingSkeleton;
