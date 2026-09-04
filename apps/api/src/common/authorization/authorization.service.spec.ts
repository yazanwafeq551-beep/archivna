import { AuthorizationService } from './authorization.service';

describe('AuthorizationService archival access', () => {
  const prisma = {
    roleAssignment: { findMany: jest.fn() },
    accessRequest: { findFirst: jest.fn() },
  } as any;
  const service = new AuthorizationService(prisma);
  const base = { id: 'record', owner_id: 'owner', institution_id: 'institution', status: 'published' };

  beforeEach(() => jest.clearAllMocks());

  it('allows public files without authentication', async () => {
    await expect(service.canReadFile({ ...base, access_level: 'public' })).resolves.toBe(true);
  });

  it('requires an active grant for sensitive files', async () => {
    prisma.roleAssignment.findMany.mockResolvedValue([]);
    prisma.accessRequest.findFirst.mockResolvedValue({ id: 'grant' });
    await expect(service.canReadFile({ ...base, access_level: 'sensitive' }, 'researcher')).resolves.toBe(true);
    expect(prisma.accessRequest.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ status: 'approved' }),
    }));
  });

  it('limits sovereign files to custodians and system administrators', async () => {
    prisma.roleAssignment.findMany.mockResolvedValue([{ role: 'researcher', institution_id: null }]);
    await expect(service.canReadFile({ ...base, access_level: 'sovereign' }, 'researcher')).resolves.toBe(false);
    prisma.roleAssignment.findMany.mockResolvedValue([{ role: 'sovereignty_custodian', institution_id: null }]);
    await expect(service.canReadFile({ ...base, access_level: 'sovereign' }, 'custodian')).resolves.toBe(true);
  });
});
