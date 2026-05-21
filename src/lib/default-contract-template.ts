export const DEFAULT_OFFICIANT_CONTRACT_TEMPLATE = `Wedding Ceremony Agreement and Confirmation

This agreement is made on {{agreement_date}} by and between {{officiant_business_name}}, hereinafter referred to as "The Officiant," and {{couple_names}}, hereinafter referred to as "The Couple."

In consideration of the mutual covenants and agreement herein contained, The Officiant and The Couple agree to the following terms and conditions:

THE OFFICIANT'S RESPONSIBILITIES

1. The Officiant shall perform a marriage ceremony for The Couple on {{wedding_date}} at the approximate time of {{wedding_time}} at/on the facility/venue of {{venue_name}}, located at {{venue_address}}.

2. The Officiant warrants that he/she/they is a professional officiant, recognized as a legally ordained minister or otherwise legally authorized wedding officiant, and fully qualified to officiate wedding ceremonies and solemnize marriages where the ceremony will be performed.

3. The Officiant will provide the following services under the terms of this agreement:

   a. A preliminary confirmation reserving the date, time, and location of the wedding ceremony as indicated above will be sent via email to The Couple.

   b. Two weeks prior to the wedding, a member of The Couple will receive a final check-in call or communication to reconfirm all aspects of the ceremony and list all items which will be needed on the day of the wedding.

   c. The Officiant shall complete and execute the marriage license and file or return said license in accordance with the instructions set forth by the jurisdiction from where the license was obtained, unless local rules require The Couple to complete that filing directly.

THE COUPLE'S RESPONSIBILITIES

1. The Couple understands that they must obtain a marriage license at the appropriate jurisdiction for which the ceremony will be performed and shall provide said marriage license to The Officiant to review and execute on the day of the ceremony. The Couple has been informed and fully understands that if a valid marriage license is not presented with government-issued identification to The Officiant before the ceremony is performed, The Officiant cannot perform a legally valid marriage ceremony.

2. The Couple shall not change the date, time, or location of the wedding as listed in this agreement without first contacting and advising The Officiant of said change, so as to determine if The Officiant is still available to perform the ceremony. The Couple also understands and recognizes that The Officiant may perform other wedding ceremonies for other couples. Therefore, such change of date, time, or location without first notifying The Officiant, or any excessive lateness of the originally scheduled wedding ceremony time, may prevent The Officiant from performing the ceremony. If The Couple changes the date, time, or location of the scheduled wedding ceremony and The Officiant is unavailable to perform the ceremony, then The Officiant reserves the right to cancel the performance of the ceremony and shall in no way be held responsible or liable for non-performance.

3. If The Officiant can still perform the wedding ceremony on the new date, time, and location, then this agreement may be amended in writing or replaced with a new agreement reflecting the new date, time, and location.

FEES, DEPOSIT, BALANCE, AND PAYMENT TERMS

1. The Couple agrees to pay The Officiant a ceremony performance fee of {{total_fee}}, plus any mutually agreed upon additional services, add-on fees, or travel expenses.

2. To reserve the wedding date, a deposit in the amount of {{deposit_amount}} shall be remitted with this agreement. The remaining balance of {{balance_due}} is due by {{balance_due_date}}.

3. Accepted payment methods: {{payment_methods}}.

4. Payment schedule and deadlines: {{payment_deadlines}}.

5. If The Couple needs to make partial payments, they may do so as long as payment in full is received by the final payment deadline listed above.

CANCELLATION AND REFUND TERMS

{{cancellation_refund_terms}}

LATE FEES AND DELAYS

1. Fees are based upon the amount of service time provided. If services go beyond the outlined details, including extensive additional communications, delays with the start of the ceremony, or other additional time requested by The Couple, additional fees may be assessed accordingly.

2. Additional late or wait-time fees: {{late_fee_terms}}.

3. No refund will be given if The Officiant is not able to perform the ceremony because of delays beyond the stipulated time period. If the ceremony starts late, The Officiant may, at his/her/their option, perform a shortened civil ceremony in place of the agreed-upon ceremony if needed due to schedule limitations.

TRAVEL AND EXPENSES

1. Included travel radius: {{included_travel_radius}}.

2. Mileage or travel fees outside the included radius: {{travel_mileage_fees}}.

3. Travel origin or service area: {{travel_origin_or_service_area}}.

4. Mileage may be determined using a mutually accepted map or mileage tool. All tolls, parking fees, entrance fees, lodging, and related travel expenses are the responsibility of The Couple unless otherwise agreed in writing.

5. Additional travel requirements, hotel accommodations, or special travel arrangements: {{additional_travel_terms}}.

ADD-ON CEREMONY ITEMS

The Couple accepts responsibility for purchasing items needed to perform any smaller ceremonies or unity rituals that they may wish to include in their ceremony, including but not limited to unity candles, memory candles, wine, roses, sand, breakable glass, or other symbolic items. If The Couple requests any special provisions from The Officiant, these details should be submitted in writing no later than {{special_requests_deadline}}.

GENERAL PROVISIONS

1. The Officiant shall arrive at the wedding location approximately {{officiant_arrival_window}} prior to the time of the wedding ceremony, unless otherwise agreed.

2. The Couple fully understands and agrees that The Officiant shall not be responsible or held liable in the event The Officiant is prohibited from performing The Couple's wedding ceremony due to illness, hospitalization, auto accident, transportation breakdown or disruption, traffic difficulties, acts of God, inclement weather, or other unforeseen incapacitation or cause of non-arrival on the day of the ceremony. The Officiant will make every reasonable attempt to notify The Couple and to provide a substitute officiant who can perform a wedding ceremony if time and resources permit.

3. In any event, The Officiant, their agents, and assigns shall not be held liable for compensation or damages, including punitive damages, due to non-performance of any ceremony or function resulting from such incapacitations, non-arrival, errors, or omissions of any type.

4. Photo and promotional permission: {{photo_video_permission_terms}}.

5. This agreement and attachments constitute the entire agreement between the parties and may not be modified except in writing signed by both parties or by written email acknowledgment received by both parties. No other representations or promises have been made except those that are set out in this agreement. If any part of this agreement is adjudged invalid, illegal, or unenforceable, the remaining parts shall not be affected and shall remain in full force and effect.

SUMMARY

Couple names: {{couple_names}}
Wedding date/time: {{wedding_date}} at {{wedding_time}}
Venue/location: {{venue_name}}, {{venue_address}}
Total ceremony fee: {{total_fee}}
Deposit amount: {{deposit_amount}}
Balance due: {{balance_due}}
Payment deadline: {{balance_due_date}}
Travel radius or mileage fees: {{included_travel_radius}} / {{travel_mileage_fees}}

IN WITNESS WHEREOF, the parties agree to the terms and conditions described above and have caused this contract to be signed on the dates indicated below.

Bride/Partner 1 print name: {{partner_1_name}}
Date: {{partner_1_signature_date}}
Bride/Partner 1 signature: {{partner_1_signature}}

Groom/Partner 2 print name: {{partner_2_name}}
Date: {{partner_2_signature_date}}
Groom/Partner 2 signature: {{partner_2_signature}}

Couple email address: {{couple_email}}
Mailing address: {{couple_mailing_address}}

Officiant print name: {{officiant_name}}
Date: {{officiant_signature_date}}
Officiant signature: {{officiant_signature}}
`

export const DEFAULT_CONTRACT_TEMPLATE_FIELDS = [
  "couple_names",
  "wedding_date",
  "wedding_time",
  "venue_name",
  "venue_address",
  "total_fee",
  "deposit_amount",
  "balance_due",
  "balance_due_date",
  "payment_deadlines",
  "cancellation_refund_terms",
  "included_travel_radius",
  "travel_mileage_fees",
]
