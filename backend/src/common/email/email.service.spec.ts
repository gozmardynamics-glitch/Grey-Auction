import { EmailService } from './email.service';

describe('EmailService (Brevo)', () => {
  let service: EmailService;
  const orig = process.env.BREVO_API_KEY;

  beforeEach(() => {
    process.env.BREVO_API_KEY = 'brevo_test';
    service = new EmailService();
  });
  afterEach(() => {
    process.env.BREVO_API_KEY = orig;
    jest.restoreAllMocks();
  });

  it('sends via the Brevo transactional email API when an API key is set', async () => {
    const spy = jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true } as any);
    await service.sendEmail({ to: 'a@b.com', subject: 'Hi', html: '<p>Body</p>' });
    expect(spy).toHaveBeenCalledWith(
      'https://api.brevo.com/v3/smtp/email',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'api-key': 'brevo_test' }),
      }),
    );
  });

});
