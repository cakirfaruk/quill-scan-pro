-- alert_logs: Sistem INSERT yapabilmeli
CREATE POLICY "System can insert alert logs"
ON public.alert_logs
FOR INSERT
WITH CHECK (true);

-- alert_logs: Adminler UPDATE yapabilmeli (acknowledge için)
CREATE POLICY "Admins can update alert logs"
ON public.alert_logs
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- escalation_logs: Sistem INSERT yapabilmeli
CREATE POLICY "System can insert escalation logs"
ON public.escalation_logs
FOR INSERT
WITH CHECK (true);

-- daily_missions: Adminler yönetebilmeli
CREATE POLICY "Admins can manage daily missions"
ON public.daily_missions
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- credit_packages: Adminler yönetebilmeli  
CREATE POLICY "Admins can manage credit packages"
ON public.credit_packages
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- credit_transactions: Sistem INSERT yapabilmeli (RPC fonksiyonları için)
CREATE POLICY "System can insert credit transactions"
ON public.credit_transactions
FOR INSERT
WITH CHECK (true);