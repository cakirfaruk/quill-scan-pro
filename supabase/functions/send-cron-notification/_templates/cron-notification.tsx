import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Hr,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface CronNotificationEmailProps {
  jobName: string
  status: 'success' | 'error'
  message: string
  executionTime?: string
  errorDetails?: string
  projectUrl: string
}

export const CronNotificationEmail = ({
  jobName,
  status,
  message,
  executionTime,
  errorDetails,
  projectUrl,
}: CronNotificationEmailProps) => (
  <Html>
    <Head />
    <Preview>{status === 'error' ? `❌ Hata: ${jobName}` : `✅ Başarılı: ${jobName}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>
          {status === 'error' ? '❌ Cron Job Hatası' : '✅ Cron Job Başarılı'}
        </Heading>
        
        <Section style={section}>
          <Text style={label}>Job Adı:</Text>
          <Text style={value}>{jobName}</Text>
        </Section>

        <Section style={section}>
          <Text style={label}>Durum:</Text>
          <Text style={{...value, color: status === 'error' ? '#ef4444' : '#22c55e'}}>
            {status === 'error' ? 'HATA' : 'BAŞARILI'}
          </Text>
        </Section>

        {executionTime && (
          <Section style={section}>
            <Text style={label}>Çalışma Zamanı:</Text>
            <Text style={value}>{executionTime}</Text>
          </Section>
        )}

        <Hr style={hr} />

        <Section style={section}>
          <Text style={label}>Mesaj:</Text>
          <Text style={messageText}>{message}</Text>
        </Section>

        {errorDetails && (
          <Section style={section}>
            <Text style={label}>Hata Detayları:</Text>
            <Text style={errorText}>{errorDetails}</Text>
          </Section>
        )}

        <Section style={section}>
          <Link href={`${projectUrl}/admin`} style={button}>
            Admin Paneline Git
          </Link>
        </Section>

        <Hr style={hr} />

        <Text style={footer}>
          Bu bildirim otomatik olarak gönderilmiştir.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default CronNotificationEmail

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0 40px',
}

const section = {
  padding: '0 40px',
  marginBottom: '16px',
}

const label = {
  color: '#6b7280',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  margin: '0 0 4px',
}

const value = {
  color: '#333',
  fontSize: '16px',
  fontWeight: '500',
  margin: '0 0 16px',
}

const messageText = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '0',
}

const errorText = {
  color: '#ef4444',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '0',
  padding: '12px',
  backgroundColor: '#fef2f2',
  borderRadius: '4px',
  fontFamily: 'monospace',
}

const button = {
  backgroundColor: '#5469d4',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '15px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 20px',
  marginTop: '16px',
}

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
}

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  padding: '0 40px',
}
