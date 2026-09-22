/**
 * Small, reusable bilingual (Arabic-first, then English) HTML email shell —
 * modeled on the table layout of
 * saleor_platform/custom_email_templates/user_email/confirm_order.html
 * (header/accent bar, Arabic block dir="rtl", divider, English block
 * dir="ltr", dark bilingual footer). Copies that visual pattern in plain
 * TypeScript template strings, not Handlebars, since this email is composed
 * in front_store at send time rather than rendered by Saleor's own
 * plugins/user_email system.
 *
 * Anything sending a bilingual transactional email to a customer should reuse
 * renderBilingualOrderEmail rather than hand-rolling another HTML shell.
 */

const BRAND_GREEN = "#2d6a4f";
const CREAM_BG = "#faf7f2";
const DIVIDER = "#e8e2d5";
const FOOTER_BG = "#0d1410";

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

export type BilingualOrderEmailInput = {
	/** Plain <title> text, English is fine — most mail clients only show it in the tab/preview list. */
	subject: string;
	titleAr: string;
	titleEn: string;
	bodyAr: string;
	bodyEn: string;
	ctaHref?: string;
	ctaLabelAr?: string;
	ctaLabelEn?: string;
};

export function renderBilingualOrderEmail(input: BilingualOrderEmailInput): string {
	const cta =
		input.ctaHref && input.ctaLabelAr && input.ctaLabelEn
			? `
		<table border="0" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;">
			<tr>
				<td bgcolor="${BRAND_GREEN}" style="background:${BRAND_GREEN};border-radius:5px;">
					<a href="${escapeHtml(
						input.ctaHref,
					)}" style="display:inline-block;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:5px;">
						${escapeHtml(input.ctaLabelEn)}
					</a>
				</td>
			</tr>
		</table>`
			: "";

	const ctaAr =
		input.ctaHref && input.ctaLabelAr
			? `
		<table border="0" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
			<tr>
				<td bgcolor="${BRAND_GREEN}" style="background:${BRAND_GREEN};border-radius:5px;">
					<a href="${escapeHtml(
						input.ctaHref,
					)}" style="display:inline-block;padding:14px 28px;font-family:'Tahoma','Segoe UI',Arial,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:5px;">
						${escapeHtml(input.ctaLabelAr)}
					</a>
				</td>
			</tr>
		</table>`
			: "";

	return `<!doctype html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(input.subject)}</title>
</head>
<body style="margin:0;padding:0;background:${CREAM_BG};font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="${CREAM_BG}" style="background:${CREAM_BG};">
    <tr><td align="center" style="padding:24px 16px;">
      <table width="600" border="0" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <tr>
          <td bgcolor="${BRAND_GREEN}" style="background:${BRAND_GREEN};padding:28px 32px;text-align:center;" align="center">
            <img src="https://tawasiplus.com/email/logo.png" width="170" alt="Tawasi Plus" style="display:block;margin:0 auto;width:170px;max-width:170px;height:auto;border:0;outline:none;text-decoration:none;" />
          </td>
        </tr>
        <tr><td bgcolor="${BRAND_GREEN}" height="3" style="background:${BRAND_GREEN};font-size:3px;line-height:3px;">&nbsp;</td></tr>

        <tr>
          <td bgcolor="#ffffff" dir="rtl" align="right" style="background:#ffffff;padding:36px 32px 4px;font-family:'Tahoma','Segoe UI',Arial,sans-serif;">
            <p style="margin:0 0 6px;font-size:26px;font-weight:bold;color:${BRAND_GREEN};line-height:1.2;text-align:right;">${escapeHtml(
							input.titleAr,
						)}</p>
            <p style="margin:0 0 20px;font-size:15px;color:#555;line-height:1.8;text-align:right;">${
							input.bodyAr
						}</p>
            ${ctaAr}
          </td>
        </tr>

        <tr>
          <td style="padding:0 32px;background:#ffffff;">
            <table width="100%" border="0" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid ${DIVIDER};font-size:0;line-height:0;">&nbsp;</td></tr></table>
          </td>
        </tr>

        <tr>
          <td bgcolor="#ffffff" dir="ltr" align="left" style="background:#ffffff;padding:20px 32px 28px;font-family:Arial,Helvetica,sans-serif;">
            <p style="margin:0 0 6px;font-size:26px;font-weight:bold;color:${BRAND_GREEN};font-family:Arial,Helvetica,sans-serif;line-height:1.2;">${escapeHtml(
							input.titleEn,
						)}</p>
            <p style="margin:0 0 20px;font-size:15px;color:#555;font-family:Arial,Helvetica,sans-serif;line-height:1.6;">${
							input.bodyEn
						}</p>
            ${cta}
          </td>
        </tr>

        <tr>
          <td bgcolor="#0d1410" style="background:${FOOTER_BG};padding:22px 32px;border-top:2px solid ${BRAND_GREEN};">
            <p dir="rtl" align="center" style="margin:0 0 4px;font-size:12px;color:#f2efe9;text-align:center;font-family:'Tahoma','Segoe UI',Arial,sans-serif;">
              الاستفسارات؟ &nbsp;<a href="mailto:info@tawasiplus.com" style="color:#7fbfa0;text-decoration:none;font-weight:bold;">info@tawasiplus.com</a>&nbsp;|&nbsp;<a href="tel:+971558711442" style="color:#7fbfa0;text-decoration:none;">+971 55 871 1442</a>
            </p>
            <p dir="ltr" align="center" style="margin:0 0 10px;font-size:12px;color:#f2efe9;text-align:center;font-family:Arial,Helvetica,sans-serif;">
              Questions? &nbsp;<a href="mailto:info@tawasiplus.com" style="color:#7fbfa0;text-decoration:none;font-weight:bold;">info@tawasiplus.com</a>&nbsp;|&nbsp;<a href="tel:+971558711442" style="color:#7fbfa0;text-decoration:none;">+971 55 871 1442</a>
            </p>
            <p dir="rtl" align="center" style="margin:0 0 2px;font-size:11px;color:#a8a29a;text-align:center;font-family:'Tahoma','Segoe UI',Arial,sans-serif;">© 2026 Tawasi Plus. جميع الحقوق محفوظة.</p>
            <p dir="ltr" align="center" style="margin:0;font-size:11px;color:#a8a29a;text-align:center;font-family:Arial,Helvetica,sans-serif;">&copy; 2026 Tawasi Plus. All rights reserved.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export { escapeHtml };
