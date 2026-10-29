/** Ürün türü sayfalarının İngilizcesi (lib/seo/product-types.ts ile aynı slug'lar; adres, kategori ve ilişkiler Türkçe kaynaktan) */
import type { ProductTypeSeo } from './product-types'

export type ProductTypeSeoEn = Pick<ProductTypeSeo, 'h1' | 'title' | 'description' | 'intro' | 'guide' | 'faq'>

// Note: paragraphs inside guide[].body are separated by "\n\n", matching the Turkish source.
export const PRODUCT_TYPES_EN: Record<string, ProductTypeSeoEn> = {
  // ───────────────────────────── solar-aku ─────────────────────────────
  'lityum-aku': {
    h1: "Lithium Batteries (LiFePO4)",
    title: "Lithium Batteries (LiFePO4): Prices and Models",
    description:
      "12.8 V, 25.6 V and 51.2 V LiFePO4 lithium batteries from TommaTech, Victron, Exelon, Apex, NP Power and Electrozirve. Compare capacity, current and cycle life.",
    intro:
      "A lithium battery for solar systems, RVs and boats uses LiFePO4 (lithium iron phosphate) chemistry to store energy. It is lighter than a lead-acid battery, lets you use most of its rated capacity and withstands far more charge-discharge cycles. On this page you will find everything from 12.8 V RV batteries to 51.2 V home energy storage batteries.",
    guide: [
      {
        heading: "12.8 V, 25.6 V or 51.2 V?",
        body:
          "A LiFePO4 cell has a nominal voltage of 3.2 V, so a 12.8 V battery is built from 4 cells, a 25.6 V battery from 8 and a 51.2 V battery from 16. Match the voltage to your inverter: 12 V inverters and RV systems need 12.8 V, while 48 V smart and hybrid inverters need 51.2 V. Higher voltage pays off as power grows: a 5,000 W load draws about 104 A at 48 V but more than 400 A at 12 V, which means very heavy cables and a large fuse.\n\nSome models cannot be connected in series (e.g. Victron Lithium SuperPack and the TommaTech Modular Series). If you are building a 24 V or 48 V system, choose a battery rated for that voltage instead of wiring 12 V batteries in series.",
      },
      {
        heading: "How to Size Battery Capacity",
        body:
          "Energy (Wh) = voltage (V) × capacity (Ah). A 12.8 V 100 Ah battery stores 1,280 Wh and a 51.2 V 100 Ah battery stores 5,120 Wh. Work out your daily consumption in Wh (device power × hours of use), add roughly 10-15% for inverter losses and divide by the battery's recommended depth of discharge.\n\nFor example, a home that uses 3,000 Wh a day needs 3,000 × 1.12 ≈ 3,360 Wh; at an 80% depth of discharge that is 3,360 / 0.8 ≈ 4,200 Wh of capacity. A 5.12 kWh, 51.2 V 100 Ah battery covers this need. For fully off-grid systems, it is wise to plan extra capacity for cloudy days.",
      },
      {
        heading: "Current Rating, Cycle Life and Communication",
        body:
          "The battery's continuous discharge current must cover the current the inverter draws from it. For example, the TommaTech PB Series 51.2 V 100 Ah model is rated for 120 A continuous discharge and 50 A continuous charge, while the Victron SuperPack 12.8 V 60 Ah is limited to 30 A and is not suitable for large inverters. When comparing cycle life figures, check the depth of discharge and temperature at which they were measured.\n\nFor 51.2 V batteries paired with hybrid and smart inverters, CAN or RS485 communication matters: the inverter adjusts charge current and voltage based on data from the battery's BMS. Check the inverter's compatible battery list before you buy.",
      },
    ],
    faq: [
      {
        q: "Can a lithium battery be charged below freezing?",
        a: "LiFePO4 batteries must not be charged below 0 °C; the minimum charging temperature for the models in our catalog is 0 °C. Discharging is possible down to -20 °C. For cold environments, install the battery in an insulated compartment that stays above freezing.",
      },
      {
        q: "Can I charge a lithium battery with my lead-acid charger?",
        a: "The charger needs a LiFePO4 profile or an adjustable charge voltage. For 12.8 V batteries the absorption voltage is typically 14.2-14.4 V (Victron SuperPack values). Lead-acid profiles with an equalize or desulfation mode must not be used on lithium batteries.",
      },
      {
        q: "Can I connect lithium batteries from different brands in parallel?",
        a: "It is not recommended. Batteries connected in parallel should be the same model and capacity, ideally from the same production batch, and their voltages should be equalized before connecting. The number of units you can parallel depends on the model; for example, the TommaTech PB Series supports up to 32 and the Modular Series up to 16.",
      },
    ],
  },
  'jel-aku': {
    h1: "Gel Batteries",
    title: "Gel Batteries: 12 V Solar Gel Battery Prices",
    description:
      "12 V gel batteries for solar and backup power systems: Exelon, Apex Safepower and NP Power in 100, 150 and 200 Ah. Plus series wiring and charge settings.",
    intro:
      "A gel battery is a sealed, maintenance-free type of lead-acid battery whose electrolyte is gelled with silica. It handles deep discharge better than flooded batteries and is used in off-grid solar systems, backup power and UPS applications. The gel batteries in our catalog have a nominal voltage of 12 V and come in 100, 150 and 200 Ah capacities.",
    guide: [
      {
        heading: "How Much Capacity Is Actually Usable?",
        body:
          "The service life of a lead-acid battery depends on how deeply you discharge it each cycle. For gel batteries cycled daily, keeping depth of discharge around 50% is a common recommendation. In that case a 12 V 200 Ah gel battery (2,400 Wh) delivers roughly 1,200 Wh of energy per day.\n\nThe Ah rating on the label is specified for a given discharge time (e.g. 10 or 20 hours). Available capacity drops at high discharge currents, so if your inverter is powerful, choose a capacity with some headroom.",
      },
      {
        heading: "Building a 24 V or 48 V System",
        body:
          "Connecting 12 V gel batteries in series raises the system voltage: 2 batteries give 24 V and 4 give 48 V. All batteries in a series string should be the same brand, model, capacity and age; mixing old and new batteries leaves the weakest one constantly over-discharged. On longer strings, a battery balancer can be used to equalize the voltage differences between batteries.\n\nYou can add parallel strings to increase capacity, but too many parallel strings lead to uneven charging. In practice, it is best not to exceed 2-3 parallel strings.",
      },
      {
        heading: "What to Watch in Charge Settings",
        body:
          "Gel batteries are sensitive to overcharging voltage. Select the GEL profile on your charge controller and inverter, or set the voltages to the battery manufacturer's values, and disable equalize mode. Heat shortens battery life; install the batteries in a cool, ventilated space and, where possible, use a charge controller with a temperature sensor.",
      },
    ],
    faq: [
      {
        q: "Should I buy a gel battery or a lithium battery?",
        a: "A gel battery costs less up front and can be enough for backup power systems that are rarely used. For systems that are deep-cycled every day, a lithium battery is usually the better long-term choice thanks to its usable capacity and cycle life. See our lithium vs. lead-acid battery article for a detailed comparison.",
      },
      {
        q: "Can a gel battery be used indoors?",
        a: "Gel batteries have a sealed (VRLA) design and give off very little gas in normal use, so they can be installed indoors. Because gas can still be released when overcharged, the battery compartment should be ventilated and the charge settings configured correctly.",
      },
      {
        q: "What is the difference between gel and AGM batteries?",
        a: "Both are sealed lead-acid batteries. In an AGM battery the electrolyte is absorbed into glass mat separators, making it better suited to delivering high current for short periods; a gel battery is more durable in slow, deep-discharge cyclic use. That is why gel batteries are a common choice for solar energy storage.",
      },
    ],
  },
  'batarya-yonetimi-ve-aksesuar': {
    h1: "Battery Management Systems (BMS) and Battery Accessories",
    title: "Battery Management Systems (BMS) and Accessories",
    description:
      "Victron smallBMS, VE.Bus BMS and Smart BMS, TommaTech HV/LV BMS, Havensis shunt battery monitor, battery combiners, balancers and modular battery cable kits.",
    intro:
      "This category covers the battery management systems (BMS) that keep lithium batteries operating safely, plus accessories for monitoring, connecting and balancing a battery bank. Here you will find external BMS units for Victron lithium batteries, control units for TommaTech Hightech Power S batteries, current-measuring shunt monitors and battery cable kits.",
    guide: [
      {
        heading: "When Do You Need an External BMS?",
        body:
          "Some lithium batteries have a built-in BMS, while others monitor their cells but leave the protection decision to an external BMS. The Victron Lithium Battery Smart series belongs to the second group and works with the smallBMS, VE.Bus BMS V2 or Smart BMS; Lithium NG batteries require the NG versions (smallBMS NG, VE.Bus BMS NG). When a cell voltage or temperature reaches its limit, the BMS protects the battery by shutting down charge sources and loads.\n\nIn the TommaTech Hightech Power S high-voltage system, the BMS is the control unit for the series-connected 4 kWh modules and communicates with the inverter. The AIO and standard versions pair with different inverter series, so choose the one that matches your inverter model.",
      },
      {
        heading: "How to Monitor State of Charge",
        body:
          "Estimating a battery's true state of charge (SOC) from voltage alone is misleading, especially with lithium batteries. A shunt-type battery monitor is installed on the battery's negative line and calculates SOC by counting the current flowing in and out. The Havensis HVSS-500 works with currents up to 500 A and between 9-70 V DC, and sends data to your phone via Bluetooth.\n\nThe Victron Smart Battery Sense wirelessly measures battery voltage and temperature and passes them to chargers on the VE.Smart network, so the charge voltage is adjusted to the battery's actual values.",
      },
      {
        heading: "What Do Battery Combiners and Balancers Do?",
        body:
          "In RVs and boats, a battery combiner (e.g. Victron Cyrix-ct 120 A) is used to charge the starter battery and the house battery together. It connects the batteries when it detects a charging voltage and separates them when the engine stops, so the starter battery is not drained. For 12 V lead-acid batteries wired in series, the Victron Battery Balancer equalizes the voltage difference between batteries; in lithium batteries, cell balancing is handled by the BMS.",
      },
    ],
    faq: [
      {
        q: "Does every lithium battery need an external BMS?",
        a: "No. Lithium batteries with a built-in BMS do not need a separate one. An external BMS is required for battery systems that monitor their cells but leave the protection decision to an external unit (e.g. the Victron Lithium Smart and NG series); check the compatible battery information on the product page.",
      },
      {
        q: "Is a battery monitor the same as a BMS?",
        a: "No. A battery monitor measures current and voltage to show the state of charge, but it does not protect the battery on its own. A BMS protects the battery by cutting off charging or discharging when cell voltage, temperature or current limits are exceeded.",
      },
      {
        q: "Why does the cable kit matter for modular batteries?",
        a: "For batteries connected in parallel to share current evenly, the cables must be of equal length and cross-section. Using the parallel and series cable kits designed for your battery model prevents heating at the terminals and uneven loading.",
      },
    ],
  },
  'tasinabilir-guc-istasyonu': {
    h1: "Portable Power Stations",
    title: "Portable Power Stations: LiFePO4 Camping Batteries",
    description:
      "TommaTech 448 Wh and 512 Wh LiFePO4 portable power stations: 500 W AC output, USB-C, 12 V output and MPPT solar charging input. For camping, RVs and outages.",
    intro:
      "A portable power station combines a lithium battery, inverter, charging circuit and outlets in a single unit, giving you a power source that needs no installation. It is used to run laptops, lighting, modems and small devices while camping, in RVs, on job sites and during power outages.",
    guide: [
      {
        heading: "Capacity (Wh) vs. Output Power (W)",
        body:
          "Wh tells you how much energy the unit stores; W tells you how much power it can deliver at once. A station with 500 W AC output cannot run devices that draw 1,500-2,000 W, such as a kettle or hair dryer; the combined power of connected devices must stay below the output rating.\n\nYou can roughly estimate runtime as capacity × 0.85 / device power (0.85 accounts for inverter losses). For example, a 512 Wh station runs a 50 W device for about 8-9 hours. The USB-C and 12 V outputs bypass the inverter, so their losses are lower.",
      },
      {
        heading: "Charging with a Solar Panel",
        body:
          "The power stations in our catalog have an MPPT solar charging input; the Plus 500W model accepts up to 200 W of panel power and the R Series up to 120 W. The panel's open-circuit voltage (Voc) must fall within the station's solar input range. To connect panels with MC4 connectors, you need the adapter cable that suits your model (MC4-XT60 or MC4-DC5525).",
      },
      {
        heading: "Why a LiFePO4 Battery?",
        body:
          "These stations use LiFePO4 chemistry, and the manufacturer specifies more than 4,000 cycles to 80% capacity. This chemistry is thermally stable but must not be charged below 0 °C. If you will not use the unit for a long time, store it partially charged and top it up every few months to keep the battery healthy.",
      },
    ],
    faq: [
      {
        q: "Can a portable power station run a refrigerator?",
        a: "Small compressor refrigerators usually run at under 500 W, but they can draw several times that at startup. Compare the station's peak power with the refrigerator's label ratings; to estimate runtime, divide the station's capacity by the refrigerator's average hourly consumption.",
      },
      {
        q: "How long does a full charge from a solar panel take?",
        a: "It depends on the panel's actual output. In good sun, a 200 W panel usually produces less than its rated power, for example 140-160 W; at that rate a 512 Wh station charges in roughly 3.5-4 hours. Charging takes longer in cloudy weather or when the panel is not angled directly at the sun.",
      },
      {
        q: "What is the difference between a power station and an RV battery system?",
        a: "A power station packages the battery, inverter and charging circuit into a ready-made unit that is portable and needs no installation. An RV battery system can scale to greater capacity and power, but the inverter, charge controller, fuses and wiring have to be selected and installed separately.",
      },
    ],
  },

  // ─────────────────────────── solar-inverter ───────────────────────────
  'tam-sinus-mppt-akilli-inverter': {
    h1: "Pure Sine Wave MPPT Smart Inverters (Off-Grid)",
    title: "Off-Grid Smart Inverters: Pure Sine Wave MPPT",
    description:
      "Pure sine wave off-grid smart inverters with MPPT solar charging: TommaTech, Exelon, Apex, NP Power, Deye and Victron. 12, 24 and 48 V models from 1 to 12 kW.",
    intro:
      "A pure sine wave MPPT smart inverter is an off-grid unit that combines an inverter, a solar charge controller and a grid/generator battery charger in one box. It is the heart of a battery-based solar system for cabins, farms without grid access and places with frequent power outages. Our catalog covers 12 V, 24 V and 48 V models from 1 kW to 12 kW.",
    guide: [
      {
        heading: "Choosing Power Rating and Battery Voltage",
        body:
          "Add up the power of all devices that will run at the same time and leave some headroom. Motor-driven appliances such as refrigerators, water pumps and air conditioners draw several times their running power at startup; the inverter's peak power (twice the rated power on the TommaTech models in our catalog) must cover this surge.\n\nBattery voltage follows the power rating: 1-1.5 kW models run on 12 V, 3-4.2 kW models on 24 V, and models of 5 kW and above on 48 V batteries. Higher voltage means lower current for the same power, thinner cables and lower losses.",
      },
      {
        heading: "PV Input and MPPT Range",
        body:
          "The open-circuit voltage (Voc) of the panel string must never exceed the inverter's maximum PV voltage, even on the coldest day, and the operating voltage (Vmp) must stay within the MPPT range. For example, the TommaTech ProX 8K has a maximum PV voltage of 500 V and an MPPT range of 90-450 V; with 450 Wp TOPCon panels rated at a Voc of 39.31 V, a string of 10 panels stays within safe limits even in cold weather.\n\nSome entry-level models in this category (such as the TommaTech New series models without \"MPPT\" in their name) use PWM solar charging. If you want MPPT, check the \"Solar charging type\" row on the product page.",
      },
      {
        heading: "Using the Grid and a Generator",
        body:
          "Smart inverters can charge the battery from the grid or a generator connected to the AC input and, when needed, power loads directly from that source. A priority setting lets you favor solar, battery or grid. Most units in this category are not designed to export energy to the grid; if you are building a grid-tied self-consumption system, look at hybrid inverters instead.\n\nIf you need more power, some models can run in parallel; for example, the TommaTech PlusX 11K supports up to 6 units in parallel.",
      },
    ],
    faq: [
      {
        q: "What is the difference between a smart inverter and a hybrid inverter?",
        a: "A smart (off-grid) inverter is built around the battery and uses the grid only as a backup charging source. A hybrid inverter operates connected to the grid, can export surplus generation and uses the battery for storage. Smart inverters are the choice for sites without grid access, while hybrid inverters are preferred for increasing self-consumption in grid-connected buildings.",
      },
      {
        q: "What does transfer time mean?",
        a: "It is the time the inverter takes to switch to battery power when the grid goes down. On TommaTech models it is 10 ms in computer mode and 20 ms in appliance mode. Select computer (UPS) mode for sensitive devices such as desktop computers.",
      },
      {
        q: "Can a smart inverter be used with a lithium battery?",
        a: "Yes. The TommaTech ProX series has an RS485 port for BMS communication, and the inverter manages charging based on data from the battery. On models that cannot communicate with the battery, you need to set the charge and cut-off voltages manually to the battery manufacturer's values.",
      },
    ],
  },
  'hibrit-inverter': {
    h1: "Hybrid Inverters",
    title: "Hybrid Inverters: Single-Phase and Three-Phase",
    description:
      "TommaTech Uno/Trio Hybrid and Deye hybrid inverters from 5 to 80 kW, single- and three-phase, for 48 V (LV) or high-voltage (HV) batteries, plus a buying guide.",
    intro:
      "A hybrid inverter manages rooftop solar panels, a battery and the grid from a single unit. Energy generated during the day first covers the building's consumption, the surplus is stored in the battery and, if needed, exported to the grid. When the grid goes down, loads connected to the backup output continue to run from the battery.",
    guide: [
      {
        heading: "LV or HV?",
        body:
          "Low-voltage (LV) hybrid inverters work with 48 V nominal batteries (within a 40-60 V range). 51.2 V LiFePO4 batteries fall into this class and capacity is expanded by connecting them in parallel; most LV models also accept lead-acid batteries. High-voltage (HV) models work with batteries of several hundred volts made up of series-connected modules; for example, the TommaTech Hightech Power S system operates between 166.4-700.8 V.\n\nIn HV systems the battery current for the same power is much lower, which simplifies wiring in high-power three-phase installations. LV systems, on the other hand, offer more flexible battery options. Make sure the inverter and battery appear together on the manufacturer's compatibility list.",
      },
      {
        heading: "Single-Phase or Three-Phase, and How Many kW?",
        body:
          "The inverter's phase must match your electricity service: single-phase connections use the TommaTech Uno Hybrid and Deye single-phase models (5-16 kW), while three-phase connections use the Trio Hybrid, F Series and Deye three-phase models (8-80 kW). When choosing the power rating, account for both the installed panel capacity and the loads that will run simultaneously on the backup output during an outage.\n\nOn the panel side, the inverter's maximum PV input power and number of MPPTs matter. For example, the Uno Hybrid N6K allows up to 12,000 W of connected panels and, with 2 MPPT inputs, can operate two different roof faces independently.",
      },
      {
        heading: "Backup Output and Export Limiting",
        body:
          "The hybrid inverter's backup output is connected to a separate sub-panel for the circuits that should stay powered during an outage. Check the backup output's continuous and peak power ratings; on TommaTech LV models the off-grid peak power is 2 times the rated power for 10 seconds, and on HV models 1.5 times.\n\nIf exporting to the grid is not wanted or must be capped, the inverter limits export by measuring power flow with a smart meter installed at the metering point. Every grid-connected system requires connection approval from the distribution company.",
      },
    ],
    faq: [
      {
        q: "Does a hybrid inverter work without a battery?",
        a: "Many hybrid inverters can operate grid-tied without a battery and let you add one later. However, the backup output will not work, or will work only to a very limited extent, during an outage without a battery. Confirm this feature in the manual of the model you choose.",
      },
      {
        q: "What is the difference between a hybrid inverter and an on-grid inverter?",
        a: "An on-grid inverter operates only while connected to the grid; when the grid goes down it shuts off for safety and cannot power the building. A hybrid inverter connects to a battery, keeps the backup output powered during an outage and lets you use daytime generation in the evening.",
      },
      {
        q: "Can I add a battery to my existing on-grid system?",
        a: "On-grid inverters do not support a battery connection. To add a battery, either replace the on-grid inverter with a hybrid inverter or plan a separate AC-coupled storage solution. Which route fits depends on your system size and existing wiring.",
      },
    ],
  },
  'on-grid-inverter': {
    h1: "On-Grid Inverters (Grid-Tied)",
    title: "On-Grid Inverters: Grid-Tied Solar Inverter Prices",
    description:
      "Deye and TommaTech on-grid inverters for rooftop and ground-mount solar: 3-10 kW single-phase, 5-100 kW three-phase. MPPT count, PV voltage, string design.",
    intro:
      "An on-grid (grid-tied) inverter converts the direct current produced by solar panels into alternating current synchronized with the grid and operates without a battery. Generated energy is consumed in the building first, and the surplus is exported to the grid. It is used on residential rooftops, commercial and agricultural facilities, and ground-mounted solar plants.",
    guide: [
      {
        heading: "How to Design a String",
        body:
          "The total open-circuit voltage of series-connected panels rises in cold weather and must never exceed the inverter's maximum PV voltage. For example, a 450 Wp TOPCon panel with a Voc of 39.31 V and a Voc temperature coefficient of -0.26 %/°C delivers about 42.9 V at -10 °C; on a TommaTech Uno Atom N3K with a maximum PV voltage of 550 V, you can connect at most 12 of these panels per string.\n\nThe string's operating voltage must also not drop below the MPPT range on hot days. Panel current must not exceed the maximum current allowed per MPPT; check this limit carefully with high-current and bifacial panels.",
      },
      {
        heading: "Why Does the Number of MPPTs Matter?",
        body:
          "Roof faces with different orientations or tilt angles should be connected to separate MPPT inputs; if they share one MPPT, the weaker string drags the other one down. The Uno Home N5K has 2 MPPTs, the Trio Zen 40 kW has 3 and the Trio Force 100 kW has 6. On roofs at risk of shading, more MPPTs let you optimize each string independently.",
      },
      {
        heading: "Inverter-to-Panel Power Ratio",
        body:
          "Because panels often produce less than their rated power, the installed panel capacity is usually sized somewhat higher than the inverter's AC power. The upper limit is set by the \"maximum PV input power\" on the inverter's datasheet; for example, 7.5 kW for the Uno Home N5K and 39 kW for the Trio Evo 30 kW. The choice between single-phase and three-phase depends on your electricity service and the distribution company's connection assessment.",
      },
    ],
    faq: [
      {
        q: "Does an on-grid inverter work during a power outage?",
        a: "No. Because of anti-islanding protection, on-grid inverters stop generating when the grid goes down; this protects technicians working on the lines. If you want power during outages, you need a hybrid inverter and a battery.",
      },
      {
        q: "Can an on-grid inverter be mounted outdoors?",
        a: "The TommaTech on-grid inverters in our catalog are rated IP65 and can be used outdoors. Still, choose a spot out of direct sunlight with good airflow; inverters derate their output power above 45 °C to protect themselves.",
      },
      {
        q: "How do I monitor generation?",
        a: "The inverters offer RS485 communication and optional Wi-Fi, GPRS or 4G modules, which let you monitor generation from a mobile app or web portal. A smart meter is added to also see the building's consumption and the energy exported to the grid.",
      },
    ],
  },
  'tam-sinus-inverter': {
    h1: "Pure Sine Wave Inverters",
    title: "Pure Sine Wave Inverters: 12 V and 24 V Models",
    description:
      "Pure sine wave inverters that turn battery power into grid-quality 230 V: Alpex, Apex, NP Power, Electrozirve and Victron Phoenix, from 250 VA up to 3,000 W.",
    intro:
      "A pure sine wave inverter converts 12 V or 24 V DC from a battery into 230 V AC with a smooth sine wave, just like the grid. It is used in RVs, boats, vehicles, cabins and small solar systems to run refrigerators, TVs, laptops and power tools. The models in this category have no grid charging, so the battery must be charged from a separate source.",
    guide: [
      {
        heading: "What Size Inverter Do You Need?",
        body:
          "Add up the power of the devices that will run at the same time and add a 20-30% margin. Motor-driven devices such as compressor refrigerators, drills and pumps draw several times their running power at startup; the inverter's surge (peak) power must cover this. For TVs and lighting only, the 300-600 W class is sufficient; for a microwave or power tools, choose the 1,500-2,000 W class.",
      },
      {
        heading: "Sizing the Battery and Cables",
        body:
          "An inverter draws roughly power / battery voltage in current from the battery, plus efficiency losses. A 1,000 W load draws more than 90 A from a 12 V battery and about 45-50 A from a 24 V battery. That is why choosing 24 V for systems above 1,500 W allows thinner cables and reduces losses.\n\nKeep the cable between battery and inverter short, size its cross-section according to the inverter manual, and install a fuse close to the battery's positive terminal. Undersized cable causes voltage drop, triggers the inverter's low-voltage alarm and makes the cable overheat.",
      },
      {
        heading: "Pure Sine Wave or Modified Sine Wave?",
        body:
          "Motor-driven appliances, compressors, audio systems, medical devices and anything with an electronic control board run without problems on a pure sine wave inverter. A modified sine wave inverter is cheaper but can cause overheating, humming or failures in these devices. If you are unsure what you will connect, choose a pure sine wave inverter.",
      },
    ],
    faq: [
      {
        q: "Does an inverter drain the battery with no load connected?",
        a: "When switched on, an inverter has some idle (no-load) consumption even with nothing connected; this is low on small models and higher on large inverters. Switch the inverter off when you will not use it for a long time; for inverters mounted in hard-to-reach places, you can use a remote control.",
      },
      {
        q: "Can I connect a 12 V inverter to a 24 V battery?",
        a: "No. The inverter's input voltage must match the battery system voltage; connecting a 12 V inverter to a 24 V battery will damage the unit. Models of the same power are often sold separately in 12 V and 24 V versions, so choose the right version before ordering.",
      },
      {
        q: "Can grid power be connected to these inverters?",
        a: "The inverters in this category have no AC input and cannot operate in parallel with the grid. If you want loads to run on grid power when it is available and on the inverter during outages, use a pure sine wave inverter with a built-in charger (UPS function) or an automatic transfer switch.",
      },
    ],
  },
  'sarjli-tam-sinus-inverter': {
    h1: "Pure Sine Wave Inverter Chargers (UPS)",
    title: "Pure Sine Wave Inverter Chargers with UPS Function",
    description:
      "Pure sine wave inverter chargers with UPS function: Apex NPS and NFS, Alpex, Havensis HINV, Victron EasyPlus, MultiPlus-II. Auto transfer and battery charging.",
    intro:
      "A pure sine wave inverter charger combines an inverter, a battery charger and an automatic transfer switch in one unit. While grid power is available, loads run from the grid and the battery is charged; when the grid fails, the unit automatically switches to producing pure sine wave power from the battery. It works as an uninterruptible power supply with an external battery for homes, offices, RVs and boats.",
    guide: [
      {
        heading: "Charge Current and Battery Capacity",
        body:
          "The unit's charge current determines how quickly the battery refills after an outage. For lead-acid batteries, a charge current of about 10-20% of battery capacity is recommended; the Apex NFS 1500 or Havensis HINV 1300W, which charge at 25 A, suit 12 V battery banks in the 125-250 Ah range. For lithium batteries, check the charge current allowed by the battery manufacturer.",
      },
      {
        heading: "Bypass Current and Transfer Time",
        body:
          "While grid power is present, loads are fed from the grid through the transfer relay inside the unit; the current this path can carry is given as the bypass or transfer switch rating (e.g. 16 A on the Apex NFS 1500 and Victron EasyPlus). Loads exceeding this rating should not be run through the unit. On the Victron EasyPlus, the transfer time during an outage is under 20 ms; devices such as computers and modems usually do not shut down within this time.",
      },
      {
        heading: "Check Voltage and Frequency Compatibility",
        body:
          "The grid in Türkiye is 230 V 50 Hz. The Victron MultiPlus-II 48/3000/35-50 in our catalog is the 120 V 60 Hz output (North American) version and must not be used in 230 V installations. Check the AC input and output voltage on the product page before you buy.",
      },
    ],
    faq: [
      {
        q: "What is the difference between an inverter charger and a UPS?",
        a: "In principle they do the same job. Off-the-shelf UPS units are mostly designed for short backup times with small internal batteries; inverter chargers can provide hours of backup with large external batteries, and you choose the battery capacity to suit your needs.",
      },
      {
        q: "Will it run a combi boiler and refrigerator during an outage?",
        a: "A combi boiler's control board and pump need a clean sine wave voltage, so it can be run on a pure sine wave inverter charger. Compare the combined power of the boiler and refrigerator (including the refrigerator's startup power) with the inverter's rating, and choose the battery capacity based on the outage duration you expect.",
      },
      {
        q: "Can solar panels be connected to these inverters?",
        a: "The units in this category have no built-in solar charge controller. To add panels, you can connect a separate MPPT charge controller to the battery or choose a pure sine wave MPPT smart inverter with built-in solar charging.",
      },
    ],
  },
  'modifiye-sinus-inverter': {
    h1: "Modified Sine Wave Inverters",
    title: "Modified Sine Wave Inverters: Prices and Models",
    description:
      "Alpex and Apex modified sine wave inverters: 300-2,000 W, 12/24 V and grid-charging (UPS) models. Which devices can they run, and which should they avoid?",
    intro:
      "A modified sine wave inverter is an economical type of inverter that converts battery DC into 230 V AC with a stepped waveform. It is adequate for resistive heaters, incandescent lamps and simple loads. Our catalog includes Alpex and Apex models from 300 to 2,000 W, plus Alpex options with grid charging (UPS).",
    guide: [
      {
        heading: "Which Devices Can It Run?",
        body:
          "A modified sine wave causes no trouble with resistive loads such as heating elements, incandescent lamps and soldering irons. With refrigerator and freezer compressors, pumps, fans, dimmable devices, some LED drivers, audio and video equipment, medical devices and appliances with electronic control boards such as combi boilers, however, it can cause overheating, humming, efficiency loss or failure. Use a pure sine wave inverter for these devices.",
      },
      {
        heading: "Choosing the Power Rating and Battery Connection",
        body:
          "Add a 20-30% margin to the total power of your load. For models above 1,000 W, choosing a 24 V battery system halves the current for the same power. Select cable cross-section and fuse rating based on the current, and keep the cable between battery and inverter short.",
      },
      {
        heading: "When Does a Modified Sine Wave UPS Inverter Make Sense?",
        body:
          "Alpex grid-charging (UPS) models charge the battery while grid power is available and switch to the battery during an outage. They are a low-budget backup solution for anyone who only wants to power simple loads such as lighting during outages; for a combi boiler or refrigerator, a pure sine wave inverter charger is the right choice.",
      },
    ],
    faq: [
      {
        q: "Can a modified sine wave inverter charge a laptop?",
        a: "Most laptop adapters work on a modified sine wave, but some may run hot or make noise. For sensitive and expensive devices, a pure sine wave inverter is the safer choice.",
      },
      {
        q: "What is the difference between modified sine wave and pure sine wave?",
        a: "A pure sine wave inverter produces a smooth waveform just like the grid; a modified sine wave inverter produces a stepped waveform close to a square wave. The harmonics in a stepped waveform cause extra heating and humming in motors and transformers.",
      },
    ],
  },
  'solar-pompa-surucusu': {
    h1: "Solar Pump Drives (VFD)",
    title: "Solar Pump Drives: Solar Irrigation Inverters",
    description:
      "Frecon and TommaTech solar pump drives from 0.4 kW to 450 kW, single- and three-phase. Run submersible and surface pumps directly from panels, with no battery.",
    intro:
      "A solar pump drive converts direct current from solar panels into variable-frequency alternating current, running standard AC submersible and surface pumps without batteries. It is used for agricultural irrigation, livestock water and tank filling where there is no grid or electricity is expensive. The drive tracks the power available from the panels with MPPT and adjusts pump speed to the solar irradiance.",
    guide: [
      {
        heading: "How to Choose the Drive Rating",
        body:
          "The drive is selected according to the pump motor's power and rated current; the current on the motor nameplate must not exceed the drive's rated output current. For example, the Frecon PV500-4T 7.5 kW drive has a rated output current of 17 A. For submersible pumps that sit right at the limit, it is safer to choose the next power rating up if the nameplate current is high.\n\nPay attention to the motor's supply voltage: the Frecon PV150 series has a single-phase 220 V input, supplies the motor with three-phase 220 V and goes up to 5.5 kW. For 380 V three-phase motors, the Frecon PV500-4T (4-450 kW) and TommaTech SPI three-phase models are used.",
      },
      {
        heading: "How Many Panels Do You Need?",
        body:
          "Frecon recommends a panel capacity of about 1.3 times the motor power: for example, 9.8 kWp for a 7.5 kW drive and 19.5 kWp for 15 kW. The open-circuit voltage of the panel string must fall within the recommended range, which is 360-430 V for the PV150 series and 550-750 V for the standard PV500-4T models.\n\nFor example, with 450 Wp TOPCon panels rated at a Voc of 39.31 V, 10 panels per string for the PV150 and 15-18 panels for the PV500-4T fall within this range. Make sure the string voltage in cold weather does not exceed the drive's maximum DC input (800 V on the standard PV500-4T model), and determine the number of strings based on total panel power and the drive's maximum DC input current.",
      },
      {
        heading: "Grid/Generator Support and Protection Functions",
        body:
          "Frecon drives can accept solar together with grid or generator power and switch between sources automatically, ensuring continuity on cloudy days and for night-time irrigation. Dry-run protection stops the pump when the water level in the well drops, and the tank level input holds the pump when the tank is full. Plan the installation of level sensors so these protections work correctly.",
      },
    ],
    faq: [
      {
        q: "Does a solar pumping system need a battery?",
        a: "No. The system pumps during daylight; energy is stored not in a battery but as water in an elevated tank or pond. If irrigation is needed at night or in cloudy weather, grid or generator power can be connected to the drive's AC input.",
      },
      {
        q: "Will my existing submersible pump work with a solar drive?",
        a: "Standard AC induction submersible and surface pumps will work as long as their voltage and current suit the drive. Compare the voltage on the motor nameplate (220 V or 380 V), the number of phases and the rated current with the drive's ratings. For single-phase capacitor-start motors, check the connection options in the drive manual.",
      },
      {
        q: "Does the pump run in cloudy weather?",
        a: "At low irradiance the drive keeps running the pump at a lower speed; when light drops below a certain level it goes into sleep mode and restarts automatically as light increases. Less water is pumped on cloudy days, so size your storage tank to cover this.",
      },
    ],
  },
  'solar-surucu-aksesuari': {
    h1: "Solar Pump Drive Accessories",
    title: "Solar Pump Drive Accessories and Diode Modules",
    description:
      "MDK25A-MDK110A power diode modules and a 4G remote access device for TommaTech SPI solar pump drives. Pick the right module and quantity for your drive rating.",
    intro:
      "This category includes the power diode modules and the remote access device used with TommaTech SPI series solar pump drives. Diode modules ensure current flows in one direction only between the panel strings and the drive's DC input, while the 4G device lets you monitor the drive without visiting the site.",
    guide: [
      {
        heading: "Why Use a Diode Module?",
        body:
          "When one of several parallel-connected panel strings is shaded or fails, reverse current can flow into it from the other strings. In hybrid pumping systems that combine solar with grid or generator power, you also do not want the sources pushing current into each other. A diode module blocks these reverse currents, protecting both the panels and the drive.",
      },
      {
        heading: "Which Module, and How Many?",
        body:
          "The module is chosen according to drive power: the MDK25A is for 2.2-5.5 kW drives, the MDK55A for 7.5-11 kW, the MDK70A for 15 kW and the MDK90A for 18.5-30 kW. Larger drives use more than one module; for example, 2 MDK90A units are recommended for 37-45 kW, and 2 MDK110A units for 55-75 kW or 3 for 90-110 kW.\n\nDiode modules heat up in operation. Mount them on a suitably sized heat sink with thermal paste and install them in a ventilated enclosure.",
      },
      {
        heading: "Remote Access",
        body:
          "The TommaTech solar pump drive 4G remote access device connects to the drive over the mobile network. Because operating status and faults can be tracked remotely, it reduces the need to drive out to distant fields for troubleshooting. The installation site must have mobile network coverage for the device to work.",
      },
    ],
    faq: [
      {
        q: "Can these diode modules be used with other brands of drives?",
        a: "The modules are matched to TommaTech SPI drives by power rating. To use one with a different brand of drive, you need to verify that the diode's current and voltage ratings cover the system's maximum DC current and voltage.",
      },
      {
        q: "Does a single-string system need a diode module?",
        a: "In small systems with a single string running on solar only, the risk of reverse current is low. If there are multiple parallel strings, or solar and AC power are used together, a diode module is recommended.",
      },
    ],
  },
  'inverter-aksesuari': {
    h1: "Inverter Accessories",
    title: "Inverter Accessories: Remote Controls and Panels",
    description:
      "Electrozirve wired/wireless inverter remotes, Victron Inverter Control and Phoenix Charger Control panels, Alpex Wi-Fi module, plus a compatibility guide.",
    intro:
      "Inverter accessories let you switch on, switch off and monitor an inverter mounted out of sight near the battery from your living space. In RVs, boats and in-cabinet installations, switching the inverter off when not in use prevents its idle consumption from needlessly draining the battery.",
    guide: [
      {
        heading: "How to Check Remote Control Compatibility",
        body:
          "Remote controls are specific to brand and series. The Electrozirve CR80, CRW80, CRW88 and CRD80 remotes work with compatible Electrozirve inverters; the Victron Inverter Control works with Phoenix inverters that have a remote control port, and the Inverter Control VE.Direct with Phoenix models that have a VE.Direct port. The Phoenix Charger Control and Skylla-i Control GX are for Victron chargers. Check your inverter manual for the type of remote control port.",
      },
      {
        heading: "Wired or Wireless?",
        body:
          "A wired remote is reliable for fixed installations; plan the cable route in advance and keep the length within the manufacturer's limit. Wireless remotes (CRW80, CRW88) are convenient in vehicles and boats where running cable is difficult. The CRD80 model with display offers an information screen in addition to on/off control.",
      },
      {
        heading: "Remote Monitoring",
        body:
          "The Alpex Wi-Fi remote monitoring module sends data from compatible Alpex inverters to your phone over a wireless network. In Victron systems, GX devices are used to monitor multiple units from a single point; these are listed in the Monitoring and Control category.",
      },
    ],
    faq: [
      {
        q: "Does the remote switch the inverter off completely?",
        a: "The remote switches off the inverter's output and greatly reduces idle consumption, but some units may continue to draw a very small current in standby. For long-term storage, it is safer to open the main disconnect between the battery and the inverter.",
      },
      {
        q: "Can the remote be used with a different brand of inverter?",
        a: "Generally not. The connector and communication method of the remotes are manufacturer-specific; use them only with the compatible models listed on the product page.",
      },
    ],
  },

  // ──────────────────────────── gunes-paneli ────────────────────────────
  'topcon-gunes-paneli': {
    h1: "TOPCon Solar Panels",
    title: "TOPCon Solar Panels: High-Efficiency N-Type Modules",
    description:
      "TommaTech n-type TOPCon panels: small 40-130 Wp panels, 285 Wp, 450 Wp Dark Series and 600 Wp bifacial. Efficiency, temperature coefficient, string sizing.",
    intro:
      "TOPCon (Tunnel Oxide Passivated Contact) is a high-efficiency monocrystalline panel technology built on n-type silicon cells. The TommaTech TOPCon panels in our catalog range from small 40 Wp models for RVs and cabins to 600 Wp bifacial models for rooftop and ground-mounted solar plants.",
    guide: [
      {
        heading: "What Sets TOPCon Panels Apart?",
        body:
          "N-type TOPCon cells are more resistant to light-induced degradation than common p-type PERC cells and are less affected by heat. The TommaTech 450 Wp and 600 Wp models have a power temperature coefficient of -0.30 %/°C and module efficiency of around 23%. When the panel surface climbs above 60 °C in summer, this low coefficient means less power loss.",
      },
      {
        heading: "Which Power Class Suits Which Application?",
        body:
          "36-cell 40-130 Wp panels are used for small 12 V battery systems, RVs, boats and street light poles. 450 Wp panels (108 half-cut cells, 1722 × 1134 mm) balance manageable size with high output on residential roofs. 600 Wp bifacial panels (144 half-cut cells, 2278 × 1134 mm, 29 kg) are intended for ground-mount and large-roof applications; they also capture light on the rear side, delivering extra yield over light-colored ground and on elevated mounting.\n\nThe Dark Series 450 Wp model has a black frame and is preferred on roofs where appearance matters.",
      },
      {
        heading: "How Many Panels per String?",
        body:
          "A panel's open-circuit voltage (Voc) rises in the cold. The TommaTech 450 Wp TOPCon panel has a Voc of 39.31 V and a Voc temperature coefficient of -0.26 %/°C; at -10 °C this rises to about 42.9 V. Set the number of panels per string so that the sum of their cold Voc values does not exceed the maximum PV voltage of the inverter or charge controller. The panels' maximum system voltage is 1,500 V DC, but in practice the inverter sets the limit.",
      },
    ],
    faq: [
      {
        q: "Does a bifacial panel produce more on every roof?",
        a: "Rear-side gain depends on how much reflected light reaches the back of the panel. A bifacial panel mounted close to a dark roof produces almost the same as a monofacial panel. Light-colored ground, white membrane roofs and elevated mounting structures increase rear-side gain.",
      },
      {
        q: "Can TOPCon panels withstand snow and wind loads?",
        a: "The 450 Wp and 600 Wp models are rated for a mechanical load of 5,400 Pa on the front (snow) and 2,400 Pa on the back (wind). For these ratings to apply, the mounting structure and clamping points must follow the manufacturer's installation manual.",
      },
      {
        q: "Can I connect a new TOPCon panel in the same string as older panels?",
        a: "It is not recommended. Series-connected panels carry the same current; if panels with different current ratings share a string, the whole string drops to the current of the weakest panel. Connect different panels to separate MPPT inputs.",
      },
    ],
  },
  'monokristal-gunes-paneli': {
    h1: "Monocrystalline Solar Panels",
    title: "Monocrystalline Solar Panels: 240 Wp Half-Cut",
    description:
      "TommaTech 240 Wp 48-cell half-cut monocrystalline solar panel: a mid-size panel for cabins, RVs and small off-grid systems. Includes MPPT connection notes.",
    intro:
      "A monocrystalline solar panel is made from single-crystal silicon cells and delivers high efficiency per unit area. The TommaTech 240 Wp 48PM panel in this category, with its half-cut cell design and mid-size format, suits small off-grid systems with limited roof space.",
    guide: [
      {
        heading: "What Do Half-Cut Cells Offer?",
        body:
          "In half-cut panels each cell is split in two; because the current per cell is halved, resistive losses and heating are reduced. Since the upper and lower halves of the panel operate separately, power loss under partial shading is more limited than with full-cell panels.",
      },
      {
        heading: "Which Systems Suit a 48-Cell Panel?",
        body:
          "A 48-cell panel's operating voltage is higher than that of 36-cell panels designed for 12 V batteries and lower than that of 60- and 72-cell rooftop panels. To make full use of this voltage, choose an MPPT charge controller; with a PWM controller the panel operates at battery voltage, so part of its power goes unused. Before connecting, read the panel's Vmp and Voc from its label and compare them with the charge controller's PV input limit.",
      },
      {
        heading: "When to Choose a Larger Panel",
        body:
          "If installation space allows and system power is high, large TOPCon panels such as 450 Wp models need fewer panels, connections and mounting hardware for the same total power. The 240 Wp panel, being easy to carry and install, is a sensible choice for limited roof space and small RV or cabin systems.",
      },
    ],
    faq: [
      {
        q: "What is the difference between monocrystalline and TOPCon?",
        a: "TOPCon is also a monocrystalline technology; the difference lies in the cell structure. With n-type cells and a passivation layer, TOPCon offers higher efficiency and lower losses in heat. Conventional monocrystalline panels are mostly made with p-type cells.",
      },
      {
        q: "How much energy does a 240 Wp panel produce per day?",
        a: "Output varies with season, location and panel angle. On a sunny summer day in Türkiye, you can expect roughly 0.9-1.2 kWh from a 240 Wp panel; in winter this drops considerably. Plan the number of panels and the battery capacity together based on your daily consumption.",
      },
    ],
  },
  'esnek-ve-katlanabilir-panel': {
    h1: "Flexible and Foldable Solar Panels",
    title: "Flexible Solar Panels and Foldable Solar Panels",
    description:
      "TommaTech flexible IBC panels (110/170 Wp), foldable briefcase-style panels (150/200 Wp) 15/25 Wp USB charging panels. For RVs, boats and camping.",
    intro:
      "Flexible and foldable panels are made for places where standard panels with glass and aluminum frames cannot be carried or mounted. Flexible panels are fixed to curved surfaces such as RV and boat roofs; foldable panels are unfolded at the campsite and carried along to charge a power station or a phone.",
    guide: [
      {
        heading: "Flexible or Foldable?",
        body:
          "Flexible panels are for permanent installation: TommaTech flexible models are 3 mm thick with an ETFE front surface and can bend up to 30°; the 110 Wp model weighs 2.3 kg. Foldable briefcase-style panels (150 and 200 Wp) are for temporary use and can be set up facing the sun, away from a vehicle parked in the shade. The 15 and 25 Wp foldable charging panels are for small devices such as phones and power banks.",
      },
      {
        heading: "Mounting and Heat",
        body:
          "Because there is no air gap behind a flexible panel, it runs hotter than framed panels and its output drops in the heat. If possible, leave a slight gap between the panel and the surface, clean the surface and use a suitable adhesive or mounting method, and do not bend the panel more than 30°. Stepping on the panel can crack the cells.",
      },
      {
        heading: "Connecting to a Battery or Power Station",
        body:
          "The 110 Wp flexible panel has a Voc of 22.8 V and connects to a 12 V battery through a charge controller. Wiring two panels in series and using an MPPT controller lowers the current and reduces cable losses. If you will use it with a power station, check that the panel's Voc is within the station's solar input range and choose the right MC4 adapter cable.",
      },
    ],
    faq: [
      {
        q: "Is a flexible panel less efficient than a standard panel?",
        a: "The TommaTech flexible 110 Wp model has an efficiency of 17.5%, lower than framed TOPCon panels at around 23%. It needs a little more area for the same power, but in return the panel is very light and conforms to curved surfaces.",
      },
      {
        q: "Can a foldable panel be used in the rain?",
        a: "The 25 Wp foldable panel is rated IPX4, meaning it resists water splashes; however, leaving it out in the rain or letting the connections get wet is not recommended. Fold and store the panels when they are dry.",
      },
      {
        q: "Can a panel with USB output charge a phone directly?",
        a: "Yes, the 15 Wp model has USB-A and USB-C outputs. Because the current fluctuates as clouds pass, charging a power bank first and then the phone gives more consistent results than charging the phone directly.",
      },
    ],
  },

  // ───────────────────────── solar-sarj-kontrol ─────────────────────────
  'mppt-sarj-kontrol-cihazi': {
    h1: "MPPT Charge Controllers",
    title: "MPPT Charge Controllers: Prices and Buying Guide",
    description:
      "MPPT solar charge controllers from Havensis, Electrozirve, NP Power, Mexxsun and Victron: 3 A to 100 A, for 12-72 V battery systems, with 100-200 V PV inputs.",
    intro:
      "An MPPT charge controller runs the solar panel at its maximum power point, converting the panel's high voltage into the voltage the battery needs at a higher current. Compared with PWM controllers, it delivers more energy to the battery, especially in cold weather, with high-voltage panels and over long cable runs.",
    guide: [
      {
        heading: "What Amp Rating Do You Need?",
        body:
          "Charge current is roughly panel power / battery voltage. Two 450 Wp panels (900 W) deliver about 75 A of charge current to a 12 V battery and about 37.5 A to a 24 V battery; in that case you would choose an 80 A controller at 12 V or a 40 A controller at 24 V. Raising the battery voltage means a smaller controller is enough for the same panel power.\n\nAlso check the battery system voltage: Havensis MPS models with 100 V PV input are for 12/24 V systems, the 70 and 80 A models for 12/24/36/48 V, and the HV MPS series for 60/72 V battery systems.",
      },
      {
        heading: "Maximum PV Voltage and String Sizing",
        body:
          "The panel string's open-circuit voltage in cold weather must not exceed the controller's maximum PV voltage, or the controller may be permanently damaged. For example, two 450 Wp TOPCon panels with a Voc of 39.31 V wired in series produce about 86 V in the cold, which suits a 100 V input controller; three in series (about 129 V in the cold) require a 150 V input model.\n\nFor charging to start, the panel voltage must be well above the battery voltage. If you need to charge a high-voltage battery from low-voltage panels, boost models such as the Havensis Boost MPPT-2472 are used.",
      },
      {
        heading: "Display, Bluetooth and Battery Profile",
        body:
          "Models with a display (such as the Electrozirve ML series and MC-4860N25) show battery voltage and charge current on the unit. External displays or Bluetooth/Wi-Fi modules can be added to models without a display; compatible products are in the Charge Controller Accessories category. Make sure the controller has a profile or adjustable charge voltage for your battery type (gel, AGM, lithium).",
      },
    ],
    faq: [
      {
        q: "What is the difference between MPPT and PWM?",
        a: "A PWM controller connects the panel directly to the battery, so the panel operates at battery voltage and its surplus voltage goes unused. An MPPT controller steps down the panel voltage and raises the current, transferring the available panel power to the battery. PWM can be enough for small 12 V systems; MPPT is more efficient for higher-power systems with series-connected panels.",
      },
      {
        q: "Does an MPPT controller work without a battery?",
        a: "Most charge controllers need battery voltage to operate, so the battery must be connected first. Some 100 V models in the Havensis MPS series are specified as able to run from the panel without a battery connected; check this feature on the product page.",
      },
      {
        q: "What is the correct connection order?",
        a: "The general rule is to connect the battery first and then the panel; when disconnecting, remove the panel first and then the battery. This way the controller detects the battery voltage correctly and panel voltage cannot damage a controller left without a battery.",
      },
    ],
  },
  'pwm-sarj-kontrol-cihazi': {
    h1: "PWM Charge Controllers",
    title: "PWM Charge Controllers: 12 V and 24 V Models",
    description:
      "Havensis MiniSolar and Electrozirve HP series PWM charge controllers: 3-60 A, 12 V and 12/24 V auto-detect models with a timer-controlled load output.",
    intro:
      "A PWM charge controller is a simple, economical device that connects the solar panel to the battery in a controlled way and prevents the battery from overcharging or over-discharging. It is used in low-power 12 V and 24 V applications such as cabin lighting, garden and street lights, and small RV and boat systems.",
    guide: [
      {
        heading: "Which Panels Should Be Used with PWM?",
        body:
          "With a PWM controller, the panel operates at battery voltage. For a 12 V battery, use 36-cell panels with an operating voltage of about 18 V; for a 24 V battery, use a 72-cell panel or two 36-cell panels in series. If high-voltage rooftop panels such as 450 Wp models are connected to a 12 V battery through a PWM controller, most of their power goes unused; choose an MPPT controller in that case.",
      },
      {
        heading: "How to Choose the Current Rating",
        body:
          "The controller's current rating must be higher than the short-circuit current (Isc) of the panel array; leaving a margin of about 25% for increases in cold, bright weather is common practice. For example, a 10 A controller is enough for a panel array with a total Isc of 8 A. Havensis MiniSolar models cover 3-20 A and the Electrozirve HP series 10-60 A.",
      },
      {
        heading: "Load Output and Timer Modes",
        body:
          "Most PWM controllers have a battery-powered DC load output that protects the battery by disconnecting the load when battery voltage drops. Havensis MiniSolar models offer 5 or 7 timer modes; for example, lighting can be set to switch on at sunset and off after a set time or at sunrise. Do not connect loads exceeding the controller's current rating or inverters to the load output; connect the inverter directly to the battery.",
      },
    ],
    faq: [
      {
        q: "Can a PWM charge controller be used with a lithium battery?",
        a: "Yes, if the controller has a lithium battery profile or an adjustable charge voltage. The charge voltages of controllers with only lead-acid profiles may not suit a lithium battery; check the supported battery types on the product page.",
      },
      {
        q: "How does 12/24 V auto-detection work?",
        a: "Havensis Standard and Digital series models measure the battery voltage on first connection to decide whether the system is 12 V or 24 V. That is why the battery must be connected to the controller first; if the battery is deeply discharged, the system voltage may be misdetected, so charge the battery first.",
      },
    ],
  },
  'aku-sarj-cihazi': {
    h1: "Battery Chargers",
    title: "Battery Chargers: AC and DC-DC Charger Prices",
    description:
      "Apex, NP Power and Electrozirve 12/24 V battery chargers, Havensis DC-DC and MPPT+DC-DC chargers, and TommaTech 24-100 V forklift battery charging units.",
    intro:
      "A battery charger charges a battery in a controlled way from the grid, a vehicle alternator or the sun. This category includes 12 V and 24 V chargers that run from a 230 V outlet, DC-DC chargers that charge the house battery from the vehicle battery in RVs and boats, and 24-100 V industrial charging units for forklift, construction machinery and light electric vehicle batteries.",
    guide: [
      {
        heading: "How to Choose the Charge Current",
        body:
          "For lead-acid (gel, AGM) batteries, a charge current of about 10-20% of battery capacity is recommended; 10-20 A suits a 100 Ah battery. Lithium batteries can take higher currents, but the limit is set by the maximum charge current on the battery's datasheet. If loads are powered while the battery is charging, account for the current they draw as well.",
      },
      {
        heading: "When Do You Need a DC-DC Charger?",
        body:
          "In RVs and boats, the house battery is charged from the alternator while the engine runs. A battery combiner relay is a simple solution, but with lithium house batteries and in newer vehicles with variable-voltage smart alternators, the house battery may not charge fully. A DC-DC charger applies the correct charge profile to the battery even as the input voltage varies.\n\nUnidirectional units charge the house battery from the starter battery, while bidirectional models can work in both directions. Havensis DualCharger models combine MPPT solar charging and DC-DC charging in one unit; on the 4030AMD model, total charge current reaches 60 A.",
      },
      {
        heading: "Industrial Battery Charging Units",
        body:
          "TommaTech charging units are for 24 V, 48 V and 72 V forklift, construction machinery and electric vehicle batteries, with wall-mounted, mobile and waterproof integrated versions. Adjustable models deliver 200-300 A across a 30-100 V or 40-100 V output range. When choosing, check the battery chemistry (LiFePO4 or NMC), the cell count and whether CAN/RS485 communication with the BMS is needed.\n\nThe Victron Blue Smart IP67 24/8 model in our catalog has a 120 V AC input and a NEMA 5-15 plug; it is not suitable for use on a 230 V grid.",
      },
    ],
    faq: [
      {
        q: "Can a charger be left connected to the battery?",
        a: "Multi-stage smart chargers switch to float charging once the battery is full and can be left connected for long periods. Simple chargers carry a risk of overcharging. For long-term storage of lithium batteries, use the storage voltage recommended by the battery manufacturer.",
      },
      {
        q: "Can gel and lithium batteries be charged with the same charger?",
        a: "Yes, if the charger has a separate profile for each battery type. Select GEL for a gel battery and the lithium profile for LiFePO4; the wrong profile will undercharge or overcharge the battery.",
      },
      {
        q: "Does a DC-DC charger drain the starter battery when the engine is off?",
        a: "DC-DC chargers monitor the starter battery's voltage and stop charging when the alternator is not running, so the starter battery is not drained. On some models this behavior can be configured with a voltage threshold or an ignition signal.",
      },
    ],
  },
  'sarj-kontrol-aksesuari': {
    h1: "Charge Controller Accessories",
    title: "Charge Controller Accessories: Displays and Monitoring",
    description:
      "Havensis Wi-Fi/Bluetooth modules and external displays, Electrozirve RM display and BT kit, Victron MPPT Control, SmartSolar display and PWM-Pro accessories.",
    intro:
      "Charge controller accessories let you monitor your solar charge controller remotely, change its settings and compensate charging for battery temperature. External displays, Bluetooth and Wi-Fi modules, temperature sensors, interface cables and wire boxes are in this category.",
    guide: [
      {
        heading: "How to Check Compatibility",
        body:
          "Accessories are specific to manufacturer and series. The Havensis Solar-WiFi-485 and MiniSolar-BT V2 modules are compatible with Havensis MPPT, DC-DC, boost and dual charger units manufactured in 2024 or later; the EKBT display works with MPPT and PWM units manufactured in 2024 or later. Check your unit's production year on its label. The C216DSP external display is available with an RS232 or RS485 interface, so specify which one you need when ordering.\n\nOn the Victron side, the MPPT Control is for MPPTs with a VE.Direct port, the SmartSolar pluggable display for MPPT models with a display slot, and the PWM-Pro accessories for the BlueSolar PWM-Pro series only.",
      },
      {
        heading: "External Display or App?",
        body:
          "An external display is handy for seeing battery voltage and charge current from your living space when the controller is mounted in a technical compartment or cabinet. Bluetooth modules allow monitoring and configuration by phone at close range. A Wi-Fi module sends data to a monitoring platform over the internet; the Havensis module is specified with a wireless range of about 50 m in open space.",
      },
      {
        heading: "Temperature Sensor and Wire Box",
        body:
          "For lead-acid batteries, the correct charge voltage changes with temperature; a temperature sensor lets the controller compensate its charge voltage for battery temperature. The Victron MPPT WireBox-M covers the cable terminals of 130 mm tall MPPT models, protecting them against accidental contact and giving a tidy installation.",
      },
    ],
    faq: [
      {
        q: "What can I monitor with the Wi-Fi module?",
        a: "On compatible units you can monitor data such as panel voltage and power, battery voltage, charge current and daily yield. The Havensis module sends data to the solarekran.com platform; there must be a wireless network signal where the module is installed.",
      },
      {
        q: "Can I add Bluetooth to my older charge controller?",
        a: "That depends on the unit's communication port. Havensis module compatibility is specified for units manufactured in 2024 or later. A VE.Direct Bluetooth Smart dongle can be added to Victron units with a VE.Direct port; this product is in the Monitoring and Control category.",
      },
    ],
  },

  // ────────────────────── solar-baglanti-ekipmani ──────────────────────
  'solar-transfer-switch': {
    h1: "Solar Transfer Switches (Automatic)",
    title: "Automatic Transfer Switches: Grid to Inverter",
    description:
      "Apex 80 A and Havensis HTS-230-15 automatic transfer switches: move loads to the inverter output when the grid fails and keep both sources off the same line.",
    intro:
      "A solar transfer switch automatically selects whether loads are fed from the grid or from the inverter. While grid power is available, loads run from the grid; when it fails, they are transferred to the inverter output. It is used in systems built around inverters that have no charger or transfer relay of their own.",
    guide: [
      {
        heading: "Why Do You Need a Transfer Switch?",
        body:
          "Connecting the grid and the inverter output to the same line will destroy the inverter and create a hazard in the wiring. A transfer switch isolates the two sources so that only one of them feeds the load at any time. Inverter chargers (with UPS function) and smart inverters have this switch built in, so a separate one is not needed.",
      },
      {
        heading: "How to Choose the Current Rating",
        body:
          "The switch's rated current must be higher than the total current of the loads it will supply. At 230 V, 15 A corresponds to about 3.4 kW; the Havensis HTS-230-15 is for home and RV applications in this class, while the Apex 80 A is for higher-current distribution boards. Install a fuse or circuit breaker of a suitable rating ahead of the switch and have the connection made by a licensed electrician.",
      },
    ],
    faq: [
      {
        q: "Does a transfer switch charge the battery from the grid?",
        a: "No. A transfer switch only selects the source; it does not charge the battery. Charging from the grid requires a separate battery charger or an inverter charger.",
      },
      {
        q: "Do devices shut off during the switchover?",
        a: "Relay-based transfer switches cause a very brief interruption during switchover. Lighting and most household appliances are unaffected, but sensitive devices such as desktop computers may restart. For these devices, choose an inverter with UPS functionality.",
      },
    ],
  },
  'sigorta-ve-dagitim': {
    h1: "DC Fuses and Distribution Equipment",
    title: "DC Fuses and Distribution: Lynx, MEGA and ANL",
    description:
      "Victron Lynx Distributor DC distribution module and modular MEGA and ANL fuse holders to protect battery, inverter and charger circuits individually.",
    intro:
      "In battery-based systems, every circuit between the battery and the inverter, charge controller and other devices must be protected by a fuse. This category includes the Victron Lynx Distributor DC distribution module and MEGA and ANL fuse holders; fuses are selected separately.",
    guide: [
      {
        heading: "Where to Install a Fuse, and What Rating?",
        body:
          "The fuse goes as close as possible to the battery's positive terminal. Its rating must be higher than the device's maximum continuous current and lower than the ampacity of the cable it protects. First size the cable cross-section for the device current, then choose the fuse to suit that cable. Because lithium batteries can deliver very high short-circuit currents, the fuse's breaking capacity also matters.",
      },
      {
        heading: "What Does the Lynx Distributor Do?",
        body:
          "The Lynx Distributor splits the positive and negative busbars from the battery bank into four separate outputs, each fitted with a MEGA fuse. Thanks to its M10 busbar connections, it can be joined side by side with other Lynx modules. In RV, boat and off-grid systems where many devices connect to a single battery bank, it keeps the wiring tidy and traceable.",
      },
      {
        heading: "MEGA or ANL?",
        body:
          "MEGA and ANL are bolt-down fuse types used on high-current DC circuits. Choose the fuse type according to the holder you will use and the other equipment in the system; Lynx products use MEGA fuses. Make sure the holder and fuse are rated for the system voltage.",
      },
    ],
    faq: [
      {
        q: "Can a circuit breaker be used instead of a fuse?",
        a: "A circuit breaker rated for DC circuits can provide both protection and isolation. AC breakers may not safely interrupt a DC arc and should not be used on battery circuits.",
      },
      {
        q: "Does the negative line need a fuse too?",
        a: "Fuses are generally installed on the positive line. The negative line carries components such as the battery monitor shunt and the main disconnect; for accurate measurement, the negatives of all loads and charge sources must pass through the shunt.",
      },
    ],
  },
  'kablo-ve-konnektor': {
    h1: "Solar Cables and Connectors",
    title: "Solar Cables and Connectors: MC4, XT60 and More",
    description:
      "MC4-XT60 and MC4-DC5525 panel cables for power stations; Victron RJ12, remote on/off, pre-charge and BMS cables. How to choose cable size and connectors.",
    intro:
      "Cables and connectors make every connection in a solar power system safe and low-loss, from panel to battery to communication between devices. This category includes panel connection cables for portable power stations and the data, control and connection cables used in Victron systems.",
    guide: [
      {
        heading: "Choosing Panel Cables and Connectors",
        body:
          "Solar panels use MC4 connectors, while the solar inputs of power stations use different sockets such as XT60 or DC5525. TommaTech V Series stations use an MC4-XT60 (12 AWG) cable and R Series stations an MC4-DC5525 (18 AWG) cable. Choose a cable cross-section that can carry the panel current and keep voltage drop below about 3%; longer runs need thicker cable.",
      },
      {
        heading: "Control and Communication Cables",
        body:
          "Victron remote on/off cables let a BMS switch a device such as an inverter or charge controller on and off. Inverting and non-inverting types are chosen according to the remote control logic of the BMS output and the connected device; check the device manual to see which one is required. RJ12 UTP cables and 3-pin extension cables are for data and sensor connections between Victron devices.",
      },
      {
        heading: "What Does a Pre-Charge Cable Do?",
        body:
          "When a device with large capacitors, such as an inverter, is first connected to the battery, it draws a very high inrush current; this can cause sparks and damage fuses or contacts. A pre-charge cable limits this inrush by slowly charging the capacitors through a resistive path before the main connection is made.",
      },
    ],
    faq: [
      {
        q: "Can MC4 connectors from different brands be mated?",
        a: "Even if MC4-compatible connectors from different manufacturers physically fit together, their contact resistance may differ, which can cause heating. It is best to use connectors from the same manufacturer for the male and female halves of a connection.",
      },
      {
        q: "What is the difference between solar cable and regular cable?",
        a: "Solar cables are double-insulated and resistant to UV light, high temperatures and DC voltage. Household cable should not be used for panel runs that will be exposed to the sun outdoors.",
      },
    ],
  },
  'izleme-ve-kontrol': {
    h1: "Solar System Monitoring and Control",
    title: "Solar System Monitoring: GX Devices and Smart Meters",
    description:
      "Victron Ekrano GX, Venus GX, GX Touch, GX Tank and Digital Multi Control plus TommaTech smart meters: monitor your solar, battery and inverter system remotely.",
    intro:
      "Monitoring and control products bring data from inverters, charge controllers, batteries and meters together on one screen and let you manage the system remotely. This category includes Victron GX system monitoring devices, displays, expansion modules and interface cables, as well as smart meters for TommaTech inverters.",
    guide: [
      {
        heading: "What Is a GX Device, and How Do You Choose One?",
        body:
          "Victron GX devices (such as the Ekrano GX and Venus GX) are the hub of the system: they bring together VE.Bus devices such as the MultiPlus and Quattro, MPPTs and battery monitors with VE.Direct ports, and VE.Can devices at a single point. They display the data on screen and send it to the VRM portal via an internet connection. The Ekrano GX has 3 VE.Direct, 2 VE.Can and 1 VE.Bus port, a 7-inch display and an 8-70 V DC power input.\n\nWhen choosing a GX device, count the connection types and number of devices in your system. The GX Tank 140 is used for tank level measurement, and the GX IO-Extender 150 for additional relays and inputs/outputs.",
      },
      {
        heading: "What Does a Smart Meter Do?",
        body:
          "A smart meter measures the energy flow between the building and the grid. With this information, hybrid and on-grid inverters can limit grid export and charge or discharge the battery according to the building's consumption. The TommaTech Uno Smart Meter is for single-phase systems and the Trio Smart Meter for three-phase systems; the CT model measures current with a current transformer. In Victron systems, the VM-3P75CT three-phase energy meter does the same job.",
      },
      {
        heading: "Remote Control Panels",
        body:
          "The Digital Multi Control lets you switch MultiPlus and Quattro inverter/chargers on and off remotely and set the grid input current limit. In RVs and boats it is used to limit current to match the fuse rating of the campsite or shore power outlet. If your system has a GX device, choose the Digital Multi Control 200/200A GX version.",
      },
    ],
    faq: [
      {
        q: "Can I monitor my Victron system over the internet?",
        a: "Yes. When you connect a GX device such as the Ekrano GX or Venus GX to the internet via Ethernet or Wi-Fi, system data is sent to the VRM portal and can be monitored from a phone or computer. Where there is no internet, a GX GSM or GX LTE modem is used; the active GPS antenna for these is in this category.",
      },
      {
        q: "Can I monitor my VE.Direct device from my phone?",
        a: "By plugging a VE.Direct Bluetooth Smart dongle into Victron devices with a VE.Direct port but no Bluetooth, you can monitor and configure them from your phone with the VictronConnect app.",
      },
      {
        q: "What is an anti-islanding protection relay?",
        a: "The UFR1001E anti-islanding protection relay disconnects grid-parallel generation when the grid goes down or when grid voltage and frequency go outside their limits. Some distribution companies may require an external protection relay for inverter systems operating in parallel with the grid.",
      },
    ],
  },

  // ────────────────────────── ruzgar-enerjisi ──────────────────────────
  'ruzgar-turbini': {
    h1: "Wind Turbines",
    title: "Wind Turbines: Home and Farm Wind Turbine Prices",
    description:
      "Altech and İstabreeze small wind turbines from 500 W to 12 kW for 12, 24 and 48 V battery systems: home, cabin and farm models, with installation notes.",
    intro:
      "Small wind turbines convert the kinetic energy of the wind into electricity to charge battery banks. Because they can generate in winter, when sunlight is weak, and at night, they complement solar power systems. Our catalog covers home, cabin and farm turbines, from 500 W İstabreeze models to the 12 kW Altech Nova series.",
    guide: [
      {
        heading: "Why Is Location So Important?",
        body:
          "The power available from the wind rises with the cube of wind speed; when wind speed doubles, theoretical power increases eightfold. That is why the average wind speed at the installation site matters far more than the turbine's rated power. Coastal areas, highland plateaus and open hilltops are suitable; in areas surrounded by trees and buildings, turbulence both reduces output and puts stress on the turbine.\n\nA widely accepted rule of thumb is to place the turbine at least 9 m higher than any obstacle within about 150 m. If possible, review wind data for the area before installation.",
      },
      {
        heading: "Rated Power and System Voltage",
        body:
          "A turbine's rated power is reached at a specific high wind speed; at average wind speeds, output is well below this figure. When comparing models, look at the power curve and the cut-in wind speed; the İstabreeze i series has a cut-in speed of 3 m/s.\n\nChoose the system voltage to suit your battery and inverter: the 500 W models are 12/24 V, the i series 1-2 kW models are 24/48 V, the Altech Boreas 2000 and 4000 models are available in 24 V or 48 V, and the Boreas 6000 and İstabreeze Heli series are 48 V. Choosing 48 V at higher power reduces cable size and losses.",
      },
      {
        heading: "Installation and Safety",
        body:
          "The turbine must be mounted on a tower designed to carry its weight and wind load, with guy wires or a suitable foundation. The turbine output must always be connected to a wind charge controller; a turbine left without a load can overspeed. A manual brake panel is recommended for storms and maintenance. In residential areas, also take noise and zoning regulations into account.",
      },
    ],
    faq: [
      {
        q: "Can a wind turbine be connected to the grid?",
        a: "Most turbines in our catalog are designed for battery-based (off-grid) systems; the energy they generate is fed to the battery through a charge controller and used via an inverter. A grid connection requires a grid inverter suited to the turbine and approval from the distribution company.",
      },
      {
        q: "Are wind turbines noisy?",
        a: "In small turbines, noise level depends on blade design and wind speed. For the İstabreeze i series, the manufacturer specifies 40 dB for the i-500, i-700 and carbon-blade models and 50 dB for the composite-blade 1-2 kW models. A noise-reducing damper fitted to the tower reduces the vibration transmitted to the structure it is mounted on.",
      },
      {
        q: "Can solar and wind charge the same battery?",
        a: "Yes. A wind-solar hybrid charge controller manages both sources in one unit; in larger systems, each source connects to the same battery through its own charge controller. This setup provides more balanced generation across the seasons.",
      },
    ],
  },
  'ruzgar-turbini-aksesuari': {
    h1: "Wind Turbine Accessories and Spare Parts",
    title: "Wind Turbine Spare Parts: Blades, Towers and Brakes",
    description:
      "İstabreeze and Altech wind turbine parts: composite and carbon blades, nose cones, tails, blade flanges, alternators, tower kits, brake panels and dampers.",
    intro:
      "This category contains the parts needed to install, maintain and repair small wind turbines: 50-107 cm blades, nose cone and tail parts, blade flanges, spare alternators, tower kits, a lattice mounting tower, a manual brake panel and a noise-reducing damper.",
    guide: [
      {
        heading: "Choosing and Replacing Blades",
        body:
          "Blades are matched to the turbine model in length and mounting; for example, the 57 cm composite blade is for the İstabreeze i-500 and the 90 cm blade for the i-700. To preserve rotor balance, replace blades as a full set of the same material rather than one at a time. An unbalanced rotor causes vibration, noise and bearing wear.\n\nA 3-arm or 5-arm blade flange and a matching nose cone are chosen according to the number of blades. When choosing between carbon and composite blades, go by the blade the turbine manufacturer recommends for that model.",
      },
      {
        heading: "Tower and Mounting",
        body:
          "The tower's load capacity must exceed the turbine's weight; İstabreeze towers come with 15 kg and 40 kg load capacities and can be raised with extension tubes. For larger turbines, the Altech 7 m lattice tower can be used. As tower height increases, wind speed and output rise, but guy wires and the foundation become more important too.",
      },
      {
        heading: "Brake Panel and Safety",
        body:
          "The manual brake panel stops the rotor by short-circuiting the turbine's three-phase output. It is connected between the turbine and the charge controller and lets you stop the turbine without climbing the tower. The turbine should be braked before a storm and before any maintenance work.",
      },
    ],
    faq: [
      {
        q: "What should I look for when choosing a spare alternator?",
        a: "The spare alternator's power class and voltage must match the existing turbine and charge controller; for example, the 500G alternator is for 12/24 V systems and the Heli 2.0 alternator for 48 V systems. Brake the turbine and lower the tower before installing it.",
      },
      {
        q: "What does a noise-reducing damper do?",
        a: "It dampens the turbine's vibration before it is transmitted to the tower and the structure it is attached to. On turbines installed near or on a building, it reduces the hum that reaches indoor spaces.",
      },
    ],
  },
  'ruzgar-sarj-kontrol-cihazi': {
    h1: "Wind Charge Controllers",
    title: "Wind Charge Controllers and Wind-Solar Hybrids",
    description:
      "İstabreeze Pro Wind 1,500-4,000 W wind charge controllers and 650/850 W wind-solar hybrid models with brake protection for 12, 24 and 48 V battery systems.",
    intro:
      "A wind charge controller rectifies the three-phase AC generated by the turbine to charge the battery and keeps the turbine under control once the battery is full. A turbine should never be connected directly to a battery without a charge controller. This category includes the İstabreeze Pro Wind series and wind-solar hybrid models.",
    guide: [
      {
        heading: "Why Do You Need a Dedicated Wind Charge Controller?",
        body:
          "Unlike a solar panel, a wind turbine can overspeed when left without a load. When the battery is full, a wind charge controller keeps the turbine under control by braking it or diverting the energy, protecting both the battery from overcharging and the turbine from runaway speed. For this reason, solar MPPT or PWM charge controllers cannot be used with a wind turbine.",
      },
      {
        heading: "Matching Power and Voltage",
        body:
          "The controller's power must be equal to or greater than the turbine's, and its battery voltage must match the turbine and battery system. The Pro Wind series is available in 1,500 W (24 V), 2,000 W (24/48 V) and 4,000 W (48 V) versions and is used with İstabreeze i-1500, i-2000 and Heli series turbines. If you will use a lithium battery, choose the version with charge voltages set for lithium.",
      },
      {
        heading: "When Is a Wind-Solar Hybrid Controller a Good Fit?",
        body:
          "Hybrid models manage a wind turbine and a solar panel in the same unit. The 650 W model has inputs for up to 500 W of wind and up to 150 W of solar and works with 12/24 V systems; the 850 W model is available in 12/24/48 V. In small cabin and hobby systems, they let you charge from both sources with a single unit.",
      },
    ],
    faq: [
      {
        q: "What happens to the turbine when the battery is full?",
        a: "When battery voltage reaches the set limit, the controller brakes the turbine automatically. For the hybrid model, the overcharge protection voltage for a 12 V system is specified as 14.9 V ±0.5 V. Automatic braking may not be enough in stormy weather, so the manual brake should be used.",
      },
      {
        q: "How do I choose the cable between the turbine and the controller?",
        a: "Because the turbine's three-phase output travels a long distance down the tower, the cable cross-section should be chosen based on voltage drop. In 12-24 V systems the current is high, so the required cross-section grows quickly; this is a major advantage of a 48 V system on long runs.",
      },
    ],
  },

  // ──────────────────────── elektrikli-arac-sarj ────────────────────────
  'elektrikli-arac-sarj-istasyonu': {
    h1: "EV Charging Stations",
    title: "EV Charging Stations: 22 kW AC Wallboxes",
    description:
      "TommaTech Likya and Trio 22 kW AC EV chargers with a Type 2 socket or 5 m tethered cable, Bluetooth, Wi-Fi/4G, RFID and OCPP 1.6J. For homes and businesses.",
    intro:
      "An AC electric vehicle charging station (wallbox) safely delivers alternating current from the grid to the vehicle through a Type 2 connector; battery charging itself is managed by the vehicle's onboard charger. It is used in home garages, residential complex parking, hotels and workplaces. The TommaTech models in our catalog offer up to 7.4 kW of charging power on a single-phase connection and up to 22 kW on a three-phase connection.",
    guide: [
      {
        heading: "Single-Phase or Three-Phase, and How Many kW?",
        body:
          "Single-phase 230 V at 32 A delivers a maximum of about 7.4 kW, while three-phase 400 V at 32 A delivers 22 kW. However, the actual charging power is limited by the vehicle's onboard AC charger: a vehicle that accepts 11 kW AC will still charge at 11 kW on a 22 kW station.\n\nYou can roughly estimate charging time as energy to be added / charging power. Taking a 60 kWh battery from 20% to 80% requires 36 kWh; including losses, this takes about 3.5 hours at 11 kW and about 5 hours at 7.4 kW.",
      },
      {
        heading: "Socketed or Tethered?",
        body:
          "With a socketed model, you plug in the vehicle's own cable each time; this suits shared locations where different vehicles use their own cables. The model with a fixed 5 m cable is convenient for home use. Plan the cable length by considering where the vehicle's charging port sits relative to the parking space.",
      },
      {
        heading: "Home and Business Use",
        body:
          "For home use, the Likya models, which can be configured via Bluetooth, are sufficient. In residential complexes, hotels and workplaces with multiple users, the Trio model can connect to charge management software thanks to RFID card user authentication, Wi-Fi/4G connectivity and the OCPP 1.6J protocol. Likya models include 30 mA Type A and 6 mA DC residual current protection; the supply circuit and protective devices should be designed by a licensed electrician.",
      },
    ],
    faq: [
      {
        q: "What do I need to install a charging station at home?",
        a: "First, check whether your distribution board and contracted supply capacity can handle the charging current; then run a dedicated circuit with a suitably sized cable to the station. Charging at 22 kW requires a three-phase connection. For detailed steps, see our article on choosing an EV charging station.",
      },
      {
        q: "Can a charging station be used with solar power?",
        a: "Because the station is supplied from the building's electrical installation, the vehicle can also be charged with energy generated by a rooftop solar system. By charging the vehicle during the day, you can use most of your solar generation directly in the car.",
      },
      {
        q: "Can the charging current be adjusted?",
        a: "On Likya models, the charging current can be adjusted between 6-32 A. If the building's supply capacity is limited, lowering the current can keep the breaker from tripping while other appliances are running.",
      },
    ],
  },
  'sarj-istasyonu-aksesuari': {
    h1: "EV Charging Station Accessories",
    title: "EV Charger Accessories: Type 2 Cables and Stands",
    description:
      "Accessories for EV charging stations: TommaTech 22 kW Type 2 32 A charging cable, LED-lit floor stand, RFID cards and shared charging management software.",
    intro:
      "Charging station accessories are products that complete the installation and use of an AC charging station. This category includes Type 2 charging cables for socketed stations, floor stands for parking areas where wall mounting is not possible, RFID cards for user authentication and software for managing shared charging points.",
    guide: [
      {
        heading: "Choosing a Type 2 Charging Cable",
        body:
          "If you use a socketed station, you need a Type 2 to Type 2 cable to connect to the vehicle. The TommaTech cable is rated for 32 A and up to 22 kW three-phase; it is 5 m long, has a 5 × 6 mm² cross-section and is IP55-rated. If your vehicle charges on single-phase or at 11 kW, you can still use this cable; what matters is that the cable's rating is not lower than that of the station and the vehicle.",
      },
      {
        heading: "Floor Stand and Installation",
        body:
          "The LED-lit floor stand is for open parking lots and residential complex areas where wall mounting is not possible. The stand comes as an empty enclosure; protective devices such as a residual current device and fuses must be selected separately and installed by an electrician.",
      },
      {
        heading: "RFID Cards and Management Software",
        body:
          "RFID cards ensure that only authorized users can start charging on stations with a card reader (e.g. the TommaTech Trio 22 kW). Shared charging management software is used in residential complexes, hotels and workplaces to track each user's consumption and split the cost.",
      },
    ],
    faq: [
      {
        q: "Do I need a separate charging cable for a tethered station?",
        a: "No. Stations with a fixed cable come with the Type 2 cable attached. A separate cable is needed only for socketed stations or as a spare.",
      },
      {
        q: "Do RFID cards work with every station?",
        a: "The cards are compatible with TommaTech stations that have an RFID reader. Card support depends on the station model; before buying, check that the station's product page lists an RFID reader.",
      },
    ],
  },
}
