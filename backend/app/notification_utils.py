def send_sms_notification(phone, message):
    """
    Placeholder for SMS API integration.
    You can integrate Twilio, Arkesel (Ghana), or any other provider here.
    """
    print(f"[SMS SIMULATION] To: {phone}, Message: {message}")
    # Integration example:
    # requests.post("https://api.sms-provider.com/send", data={"to": phone, "msg": message, "key": API_KEY})
    return True

def send_whatsapp_notification(phone, message):
    """
    Placeholder for WhatsApp API integration.
    """
    print(f"[WHATSAPP SIMULATION] To: {phone}, Message: {message}")
    return True

def notify_payment_recorded(client_name, phone, amount, receipt_number):
    message = f"Hello {client_name}, your payment of GHS {amount:,.2f} has been recorded (Receipt: {receipt_number}). Thank you!"
    send_sms_notification(phone, message)
    # send_whatsapp_notification(phone, message)
