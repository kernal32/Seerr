import SettingsLayout from '@app/components/Settings/SettingsLayout';
import SettingsReadingDiscover from '@app/components/Settings/SettingsReadingDiscover';
import useRouteGuard from '@app/hooks/useRouteGuard';
import { Permission } from '@app/hooks/useUser';
import type { NextPage } from 'next';

const ReadingDiscoverSettingsPage: NextPage = () => {
  useRouteGuard(Permission.ADMIN);
  return (
    <SettingsLayout>
      <SettingsReadingDiscover />
    </SettingsLayout>
  );
};

export default ReadingDiscoverSettingsPage;
