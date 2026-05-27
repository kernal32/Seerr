import StatusBadgeMini from '@app/components/Common/StatusBadgeMini';
import Placeholder from '@app/components/TitleCard/Placeholder';
import { withProperties } from '@app/utils/typeHelpers';
import { MediaType } from '@server/constants/media';
import type { MediaStatus } from '@server/constants/media';
import Link from 'next/link';

interface ReadingTitleCardProps {
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  mediaType: MediaType.BOOK | MediaType.AUDIOBOOK;
  status?: MediaStatus;
  foreignAuthorId?: string;
}

const detailPathForMediaType = (
  mediaType: MediaType.BOOK | MediaType.AUDIOBOOK
): string => (mediaType === MediaType.AUDIOBOOK ? '/audiobook' : '/book');

const ReadingTitleCard = ({
  id,
  title,
  subtitle,
  image,
  mediaType,
  status,
  foreignAuthorId,
}: ReadingTitleCardProps) => {
  const detailPath = detailPathForMediaType(mediaType);

  return (
    <Link
      href={{
        pathname: `${detailPath}/${encodeURIComponent(id)}`,
        query: foreignAuthorId ? { authorId: foreignAuthorId } : {},
      }}
      className="relative block w-36 sm:w-36 md:w-44"
    >
      <div className="relative w-full overflow-hidden rounded-xl bg-gray-800">
        <div className="w-full" style={{ paddingBottom: '150%' }} />
        {image ? (
          <img
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            src={image}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-700 px-2 text-center text-xs text-gray-400">
            {title}
          </div>
        )}
        {status && (
          <div className="absolute right-0 top-0 m-2">
            <StatusBadgeMini shrink status={status} />
          </div>
        )}
      </div>
      <div className="mt-2 truncate text-sm font-semibold text-white">
        {title}
      </div>
      {subtitle && (
        <div className="truncate text-xs text-gray-400">{subtitle}</div>
      )}
    </Link>
  );
};

export default withProperties(ReadingTitleCard, {
  Placeholder: () => <Placeholder />,
});
