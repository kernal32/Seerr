import ReadingTitleCard from '@app/components/TitleCard/ReadingTitleCard';
import Slider from '@app/components/Slider';
import { ArrowRightCircleIcon } from '@heroicons/react/24/outline';
import type { MediaType } from '@server/constants/media';
import type { ReadingMediaResult } from '@server/models/ReadingMedia';
import Link from 'next/link';
import { useEffect } from 'react';
import useSWRInfinite from 'swr/infinite';

interface ReadingDiscoverResponse {
  page: number;
  totalPages: number;
  totalResults: number;
  results: ReadingMediaResult[];
}

const withPageQuery = (url: string, page: number): string => {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}page=${page}`;
};

interface ReadingMediaSliderProps {
  title: string;
  url: string;
  linkUrl?: string;
  sliderKey: string;
  mediaType: typeof MediaType.BOOK | typeof MediaType.AUDIOBOOK;
  hideWhenEmpty?: boolean;
}

const ReadingMediaSlider = ({
  title,
  url,
  linkUrl,
  sliderKey,
  mediaType,
  hideWhenEmpty = true,
}: ReadingMediaSliderProps) => {
  const { data, error, setSize, size, isLoading } = useSWRInfinite<ReadingDiscoverResponse>(
    (pageIndex: number, previousPageData: ReadingDiscoverResponse | null) => {
      if (pageIndex > 0 && !previousPageData) {
        return null;
      }

      if (previousPageData && pageIndex + 1 > previousPageData.totalPages) {
        return null;
      }

      return withPageQuery(url, pageIndex + 1);
    },
    {
      initialSize: 1,
      revalidateFirstPage: false,
      shouldRetryOnError: false,
    }
  );

  const titles = (data ?? []).reduce(
    (accumulator, page) => [...accumulator, ...page.results],
    [] as ReadingMediaResult[]
  );

  useEffect(() => {
    if (
      titles.length < 24 &&
      size < 5 &&
      (data?.[0]?.totalResults ?? 0) > size * 20
    ) {
      setSize(size + 1);
    }
  }, [titles.length, size, data, setSize]);

  if (hideWhenEmpty && error) {
    return null;
  }

  if (hideWhenEmpty && data && titles.length === 0) {
    return null;
  }

  const items = titles.slice(0, 20).map((item) => (
    <ReadingTitleCard
      key={item.id}
      id={item.id}
      title={item.title}
      subtitle={item.subtitle}
      image={item.coverUrl}
      mediaType={mediaType}
      status={item.mediaInfo?.status}
      foreignAuthorId={item.foreignAuthorId}
    />
  ));

  return (
    <>
      <div className="slider-header">
        {linkUrl ? (
          <Link href={linkUrl} className="slider-title min-w-0 pr-16">
            <span className="truncate">{title}</span>
            <ArrowRightCircleIcon />
          </Link>
        ) : (
          <div className="slider-title">
            <span>{title}</span>
          </div>
        )}
      </div>
      <Slider
        sliderKey={sliderKey}
        isLoading={isLoading}
        isEmpty={Boolean(data && titles.length === 0 && !isLoading)}
        items={items}
        placeholder={<ReadingTitleCard.Placeholder />}
      />
    </>
  );
};

export default ReadingMediaSlider;
