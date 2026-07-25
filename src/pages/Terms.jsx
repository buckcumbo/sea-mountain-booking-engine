import React from "react";
import { Link } from "react-router-dom";
import Seo from "@/components/Seo";

function Section({ title, children }) {
  return (
    <section>
      <h2 className="font-heading text-xl font-semibold text-coast-navy mb-2">{title}</h2>
      <div className="space-y-3 text-muted-foreground leading-relaxed">{children}</div>
    </section>
  );
}

export default function Terms() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <Seo title="Terms | Sea Mountain Vacations" path="/terms" />
      <h1 className="font-heading text-3xl md:text-4xl font-semibold text-coast-navy mb-3">
        Terms &amp; Conditions
      </h1>
      <p className="text-sm text-muted-foreground mb-10">Sea Mountain Vacations</p>
      <div className="space-y-8 text-muted-foreground leading-relaxed">
        <Section title="Reservation and Payment">
          <p>
            A deposit of 50% of the total rental amount is required to secure a reservation. The
            balance is due 30 days prior to arrival. Payments can be made by credit card.
          </p>
        </Section>

        <Section title="Cancellation Policy">
          <p>
            Cancellations made more than 30 days prior to arrival will be refunded in full.
            Cancellations within 30 days of arrival are non-refundable.
          </p>
          <p>
            Please note that the above Reservation and Payment Policy and Cancellation Policy apply
            exclusively to direct bookings made with us. For bookings made through third-party
            platforms such as Airbnb or VRBO, the policies set forth by the respective platform at
            the time of reservation will apply.
          </p>
        </Section>

        <Section title="Occupancy">
          <p>
            The number of guests must not exceed the reservation confirmation. Unauthorized
            occupants will be charged $100 per person, per night. Sea Mountain Vacations reserves the
            right to enforce immediate eviction in the event of unauthorized occupancy.
          </p>
        </Section>

        <Section title="Check-In and Check-Out">
          <p>
            Check-in is at 4:00 PM, and check-out is at 10:00 AM. Early check-in/late check-out may
            be available for a fee.
          </p>
        </Section>

        <Section title="Damage and Cleaning">
          <p>
            Guests are responsible for maintaining the property. Any damage, excessive wear, or
            additional cleaning needed will be charged to the guest.
          </p>
        </Section>

        <Section title="Cleaning Fee">
          <p>
            A housekeeping fee is included in all reservations and varies by property size. Homes
            are professionally cleaned before arrival. Any concerns must be reported immediately for
            resolution. Refunds are not issued for cleaning complaints.
          </p>
        </Section>

        <Section title="Pool Liability">
          <p>
            Guests acknowledge and agree that the use of any pool on the rental property is at their
            own risk. Guests assume full responsibility for the safety and supervision of all persons
            using the pool, and agree to comply with all posted pool rules and safety instructions.
            Sea Mountain Vacations shall not be liable for any injuries, damages or losses arising
            from the use of the pool or pool area. Guests agree to indemnify and hold harmless the
            rental management company from any and all claims, damages, or expenses arising from the
            use of the pool or pool area. Guests are strongly advised to ensure that all individuals
            using the pool are capable swimmers and that appropriate safety measures, such as pool
            fencing or supervision, are taken to ensure the safety of all guests.
          </p>
          <p>
            Pools and hot tubs have electrical/mechanical components. These components can sometimes
            malfunction. Sea Mountain Vacations and the Homeowner cannot be held responsible for any
            malfunctioning pool or hot tub. Please inform us as soon as possible if your pool or hot
            tub is not working properly. No compensation will be given for a malfunctioning
            pool/spa. Sea Mountain Vacations will do everything in its power to rectify any problems
            with malfunctioning equipment as quickly as possible. All pool equipment must be operated
            by a licensed professional. Community or condominium pools are not controlled or
            maintained by Sea Mountain Vacations and cannot be held responsible for any inconvenience
            resulting from the pool. If you feel your pool's heater is not working properly, please
            call the office during normal business hours, 9am–5pm. This is NOT considered an
            emergency.
          </p>
          <p>
            <strong className="text-coast-navy">Heated Pool Disclaimer:</strong> Kindly note that
            while some of our pools are equipped with heating capabilities, during the colder months,
            the effectiveness of heating can vary due to lower ambient temperatures. Generally
            speaking, the pool heater should be operational between the months of March–November.
            This might result in a cooler swim experience. We appreciate your understanding and hope
            you enjoy the unique charm of each season during your stay.
          </p>
        </Section>

        <Section title="Age Requirement">
          <p>
            Rentals are generally restricted to guests 25+, though exceptions may be made on a
            case-by-case basis. The primary renter is responsible for disclosing if they are below 25
            years of age at the time of booking. Underage drinking/partying is strictly prohibited.
            Violations may result in eviction without refund.
          </p>
        </Section>

        <Section title="Channel Home Liability">
          <p>
            Properties near water present hazards. Guests assume full responsibility for safety and
            agree to indemnify Sea Mountain Vacations against related claims.
          </p>
        </Section>

        <Section title="Pets">
          <p>
            Pets are only allowed in designated pet-friendly homes with prior approval. Unauthorized
            pets will result in a $500 fee. Approved pets require a $150 non-refundable fee, with a
            max of two pets unless otherwise discussed. Failure to clean up after pets will result in
            an additional charge based on severity.
          </p>
        </Section>

        <Section title="Weddings and Events">
          <p>
            All events must be pre-approved. A $1,500 event fee and $1,000 refundable deposit apply.
            Events must comply with HOA rules, noise restrictions, and any necessary permits.
            Non-compliance may result in eviction without a refund.
          </p>
        </Section>

        <Section title="Service Animals">
          <p>
            Service and emotional support animals are permitted per ADA/FHA laws. Written
            documentation from a provider is required at booking. Unauthorized animals may result in
            a $500 fine.
          </p>
        </Section>

        <Section title="Smoking">
          <p>
            All properties are non-smoking. Smoking on balconies or outside is allowed if
            windows/doors remain shut. Evidence of smoking indoors will result in a $500 cleaning
            fee. Guests must properly dispose of cigarette butts to avoid additional charges.
          </p>
        </Section>

        <Section title="Supplies">
          <p>
            A starter set of essentials (soap, toilet paper, paper towels, dish detergent, and trash
            bags) is provided. Guests are responsible for additional supplies. Linens and towels are
            provided, but guests must bring beach towels.
          </p>
        </Section>

        <Section title="What Is Provided at the Property Upon Arrival">
          <p>
            All properties include linens, towels, and a starter supply of toiletries and cleaning
            products intended for short stays. Guests should plan to purchase additional supplies if
            needed.
          </p>
        </Section>

        <Section title="Owner Closets">
          <p>
            Some homes have locked owner storage areas. Guests must not tamper with or attempt to
            access these spaces. Any damage to owner storage will be billed to the guest.
          </p>
        </Section>

        <Section title="Properties Are Privately Owned">
          <p>
            Each home is individually owned and decorated. Descriptions are as accurate as possible,
            but changes may occur. No refunds will be issued for minor discrepancies in décor or
            furnishings.
          </p>
        </Section>

        <Section title="Maintenance and Repairs">
          <p>
            Sea Mountain Vacations will address maintenance issues as soon as possible, but no
            refunds will be issued for temporary disruptions of services or amenities. Staff may
            enter the property for maintenance purposes.
          </p>
        </Section>

        <Section title="Equipment Failure, Housekeeping, and Other Inconveniences">
          <p>
            Guests must report issues immediately. No refunds will be issued for malfunctions of
            appliances, electronics, internet, pools, weather-related conditions, or cleaning
            issues. Housekeeping concerns will be promptly addressed but not refunded.
          </p>
        </Section>

        <Section title="Extortion and Review-Related Threats">
          <p>
            Using negative reviews or false claims to seek refunds or benefits is a breach of this
            agreement and may result in legal action or termination of the rental without refund.
          </p>
        </Section>

        <Section title="Lost and Found">
          <p>
            Items left behind will be held for two weeks before being donated. Sea Mountain
            Vacations is not responsible for lost items.
          </p>
        </Section>

        <Section title="Beach Nourishment and Construction">
          <p>
            Beach projects and nearby construction may occur. No refunds or relocation requests
            will be accommodated for such inconveniences.
          </p>
        </Section>

        <Section title="Inclement Weather">
          <p>
            No refunds will be issued for weather-related cancellations. Guests are strongly
            encouraged to purchase travel insurance to cover disruptions. In the event of a mandatory
            evacuation, guests must vacate the property.
          </p>
        </Section>

        <Section title="Noise Ordinance">
          <p>
            The area enforces a noise ordinance from 11 PM to 7 AM. Noise monitors are installed in
            some homes to prevent violations. If ignored, law enforcement will be called.
          </p>
        </Section>

        <Section title="Hours of Operation">
          <p>
            Maintenance is available from 9 AM–5 PM. Non-emergency issues reported after 4 PM will be
            addressed the following day.
          </p>
        </Section>

        <Section title="Emergency Line">
          <p>
            A staff member is available 24/7 for major emergencies, including gas leaks, fires,
            lockouts, and whole-house power outages. Issues such as pool heat, appliances, TVs, and
            internet are not emergencies and must be reported during business hours.
          </p>
        </Section>

        <Section title="Liability Waiver">
          <p>
            Guests release Sea Mountain Vacations and property owners from liability for loss,
            damage, or injury incurred during their stay. Guests agree to indemnify owners and
            management from claims arising from their stay.
          </p>
        </Section>

        <Section title="Rental Guardian">
          <p>
            Sea Mountain Vacations offers travel insurance and a damage waiver policy through Rental
            Guardian. Guests can purchase travel insurance to protect against trip cancellations or
            interruptions. A damage waiver fee is included in all reservations, covering accidental
            damage or loss of property.
          </p>
        </Section>

        <Section title="SMS Terms and Conditions">
          <p>
            By opting in, you agree to receive SMS text messages from Sea Mountain Vacations,
            including booking confirmations, property updates, special offers, and promotional
            messages. Message frequency varies. Msg &amp; data rates may apply.
          </p>
          <p>
            To opt out, reply STOP at any time. You will receive one confirmation message and no
            further texts will be sent.
          </p>
          <p>
            For help, reply HELP or contact us at info@seamountainvacations.com.
          </p>
          <p>
            Your privacy is important to us. Please review our{" "}
            <Link to="/privacy" className="text-coast-ocean hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </Section>

        <Section title="Other Agreement">
          <p>
            Any modifications or alternative agreements must be in writing and signed by both
            parties.
          </p>
        </Section>

        <p className="font-heading font-semibold text-coast-navy pt-4">
          BY BOOKING THIS PROPERTY, YOU AGREE TO THE ABOVE TERMS AND CONDITIONS.
        </p>
      </div>
    </div>
  );
}