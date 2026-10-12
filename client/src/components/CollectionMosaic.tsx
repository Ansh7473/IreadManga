import { proxyUrl } from "../api";
import { CoverImage } from "./CoverImage";

type Props = {
  coverUrls: (string | null)[];
  title: string;
};

export function CollectionMosaic({ coverUrls, title }: Props) {
  const [hero, thumbA, thumbB] = coverUrls;

  return (
    <div className="collection-mosaic" aria-hidden>
      <div className="collection-mosaic__hero">
        {hero ? (
          <CoverImage src={proxyUrl(hero)} alt="" />
        ) : (
          <div className="collection-mosaic__fallback" />
        )}
      </div>
      <div className="collection-mosaic__stack">
        <div className="collection-mosaic__thumb">
          {thumbA ? (
            <CoverImage src={proxyUrl(thumbA)} alt="" />
          ) : (
            <div className="collection-mosaic__fallback" />
          )}
        </div>
        <div className="collection-mosaic__thumb">
          {thumbB ? (
            <CoverImage src={proxyUrl(thumbB)} alt="" />
          ) : (
            <div className="collection-mosaic__fallback" />
          )}
        </div>
      </div>
      <span className="visually-hidden">{title} covers</span>
    </div>
  );
}
