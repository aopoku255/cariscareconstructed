/**
 * Seeds system configuration (roles, permissions, settings, menus, categories) and the verified
 * initial content transcribed from the legacy website. Safe to run repeatedly: existing rows,
 * including anything edited in the dashboard, are left untouched.
 *
 *   npm run db:seed              system + verified content
 *   npm run db:seed -- --system  system configuration only
 */
import { sequelize } from '../models';
import { seedPages, seedPeopleAndPartners, seedPublishing, seedRedirects, seedResearch } from '../seeders/content';
import { revalidateFrontend } from '../services/revalidate.service';
import { seedCategories, seedMenus, seedRolesAndPermissions, seedSettings, seedStaffGroups } from '../seeders/system';

async function main() {
  const systemOnly = process.argv.includes('--system');
  await sequelize.transaction(async (t) => {
    await seedRolesAndPermissions(t);
    await seedSettings(t);
    await seedCategories(t);
    await seedStaffGroups(t);
    await seedMenus(t);
    console.log('System configuration seeded.');
    if (systemOnly) return;
    const counts = {
      pages: await seedPages(t),
      peopleAndPartners: await seedPeopleAndPartners(t),
      research: await seedResearch(t),
      publishing: await seedPublishing(t),
      redirects: await seedRedirects(t),
    };
    console.log('Verified content seeded (new rows):', counts);
  });
  // Seeded rows bypass the admin API, so purge the frontend cache the same way an edit would.
  await revalidateFrontend(['settings', 'menus', 'home', 'pages', 'partners', 'staff', 'research', 'publications', 'cpd', 'redirects', 'media']);
  console.log('Next: run "npm run admin:create" to create the first administrator, then optionally "npm run import:wordpress".');
}

main()
  .then(() => sequelize.close())
  .catch(async (err) => {
    console.error(err);
    await sequelize.close();
    process.exit(1);
  });
