import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
    const { email, inviteUrl, clubName } = await req.json();

    if (!email || !inviteUrl) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    const smtpFrom = process.env.SMTP_FROM || smtpUser;

    if (!smtpHost || !smtpUser || !smtpPass) {
        // No SMTP configured — return the link for manual sharing
        return NextResponse.json({ success: false, noSmtp: true, inviteUrl });
    }

    const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
    });

    await transporter.sendMail({
        from: `"${clubName || 'ACHV'}" <${smtpFrom}>`,
        to: email,
        subject: `Invitation à rejoindre l'administration de ${clubName || 'ACHV'}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #e63946;">Invitation administrateur — ${clubName || 'ACHV'}</h2>
                <p>Vous avez été invité(e) à rejoindre l'équipe d'administration du site de ${clubName || 'ACHV'}.</p>
                <p>Cliquez sur le bouton ci-dessous pour créer votre compte :</p>
                <a href="${inviteUrl}" style="display: inline-block; background: #e63946; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 16px 0;">
                    Créer mon compte administrateur
                </a>
                <p style="color: #666; font-size: 0.9em;">Ce lien est valable 7 jours. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="color: #999; font-size: 0.8em;">${clubName || 'ACHV'} — Administration du site</p>
            </div>
        `,
    });

    return NextResponse.json({ success: true });
}
