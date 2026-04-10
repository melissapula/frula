/**
 * State real estate commission directory.
 *
 * The paperwork guides are concept-level (what a seller disclosure IS,
 * how a purchase agreement WORKS, etc.). For the actual forms, users
 * need their own state's official version. This map gives every state
 * an authoritative source link so we never have to host forms ourselves.
 *
 * Each entry points to either:
 *   - the state's real estate commission/regulator homepage, or
 *   - the state's official forms page if they have one
 *
 * If a state's site changes URL, update it here once and every guide
 * benefits automatically.
 */

export interface StateResource {
    code: string
    name: string
    /** Authoritative state real estate regulator */
    commissionName: string
    /** Best landing page for finding official forms / consumer info */
    url: string
}

export const STATE_RESOURCES: StateResource[] = [
    {
        code: 'AL',
        name: 'Alabama',
        commissionName: 'Alabama Real Estate Commission',
        url: 'https://arec.alabama.gov/',
    },
    {
        code: 'AK',
        name: 'Alaska',
        commissionName: 'Alaska Real Estate Commission',
        url: 'https://www.commerce.alaska.gov/web/cbpl/ProfessionalLicensing/RealEstateCommission.aspx',
    },
    {
        code: 'AZ',
        name: 'Arizona',
        commissionName: 'Arizona Department of Real Estate',
        url: 'https://azre.gov/',
    },
    {
        code: 'AR',
        name: 'Arkansas',
        commissionName: 'Arkansas Real Estate Commission',
        url: 'https://www.arec.arkansas.gov/',
    },
    {
        code: 'CA',
        name: 'California',
        commissionName: 'California Department of Real Estate',
        url: 'https://www.dre.ca.gov/',
    },
    {
        code: 'CO',
        name: 'Colorado',
        commissionName: 'Colorado Division of Real Estate',
        url: 'https://dre.colorado.gov/',
    },
    {
        code: 'CT',
        name: 'Connecticut',
        commissionName: 'Connecticut Real Estate Commission',
        url: 'https://portal.ct.gov/dcp/occupational-and-professional-division/occupational-boards/connecticut-real-estate-commission',
    },
    {
        code: 'DE',
        name: 'Delaware',
        commissionName: 'Delaware Real Estate Commission',
        url: 'https://dpr.delaware.gov/boards/realestate/',
    },
    {
        code: 'FL',
        name: 'Florida',
        commissionName: 'Florida Real Estate Commission',
        url: 'https://www.myfloridalicense.com/DBPR/real-estate-commission/',
    },
    {
        code: 'GA',
        name: 'Georgia',
        commissionName: 'Georgia Real Estate Commission',
        url: 'https://grec.state.ga.us/',
    },
    {
        code: 'HI',
        name: 'Hawaii',
        commissionName: 'Hawaii Real Estate Commission',
        url: 'https://cca.hawaii.gov/pvl/boards/realestate/',
    },
    {
        code: 'ID',
        name: 'Idaho',
        commissionName: 'Idaho Real Estate Commission',
        url: 'https://irec.idaho.gov/',
    },
    {
        code: 'IL',
        name: 'Illinois',
        commissionName: 'Illinois Department of Financial and Professional Regulation',
        url: 'https://idfpr.illinois.gov/profs/realest.html',
    },
    {
        code: 'IN',
        name: 'Indiana',
        commissionName: 'Indiana Real Estate Commission',
        url: 'https://www.in.gov/pla/professions/real-estate-home/',
    },
    {
        code: 'IA',
        name: 'Iowa',
        commissionName: 'Iowa Real Estate Commission',
        url: 'https://plb.iowa.gov/board/real-estate',
    },
    {
        code: 'KS',
        name: 'Kansas',
        commissionName: 'Kansas Real Estate Commission',
        url: 'https://www.krec.ks.gov/',
    },
    {
        code: 'KY',
        name: 'Kentucky',
        commissionName: 'Kentucky Real Estate Commission',
        url: 'https://krec.ky.gov/',
    },
    {
        code: 'LA',
        name: 'Louisiana',
        commissionName: 'Louisiana Real Estate Commission',
        url: 'https://www.lrec.gov/',
    },
    {
        code: 'ME',
        name: 'Maine',
        commissionName: 'Maine Real Estate Commission',
        url: 'https://www.maine.gov/pfr/professionallicensing/professions/real-estate-commission',
    },
    {
        code: 'MD',
        name: 'Maryland',
        commissionName: 'Maryland Real Estate Commission',
        url: 'https://www.dllr.state.md.us/license/mrec/',
    },
    {
        code: 'MA',
        name: 'Massachusetts',
        commissionName:
            'Massachusetts Board of Registration of Real Estate Brokers and Salespersons',
        url: 'https://www.mass.gov/orgs/board-of-registration-of-real-estate-brokers-and-salespersons',
    },
    {
        code: 'MI',
        name: 'Michigan',
        commissionName: 'Michigan Board of Real Estate Brokers and Salespersons',
        url: 'https://www.michigan.gov/lara/bureau-list/bpl/occ/prof/real-estate',
    },
    {
        code: 'MN',
        name: 'Minnesota',
        commissionName: 'Minnesota Department of Commerce',
        url: 'https://mn.gov/commerce/business/real-estate/index.jsp',
    },
    {
        code: 'MS',
        name: 'Mississippi',
        commissionName: 'Mississippi Real Estate Commission',
        url: 'https://www.mrec.ms.gov/',
    },
    {
        code: 'MO',
        name: 'Missouri',
        commissionName: 'Missouri Real Estate Commission',
        url: 'https://pr.mo.gov/realestate.asp',
    },
    {
        code: 'MT',
        name: 'Montana',
        commissionName: 'Montana Board of Realty Regulation',
        url: 'https://boards.bsd.dli.mt.gov/realty-regulation/',
    },
    {
        code: 'NE',
        name: 'Nebraska',
        commissionName: 'Nebraska Real Estate Commission',
        url: 'https://nrec.nebraska.gov/',
    },
    {
        code: 'NV',
        name: 'Nevada',
        commissionName: 'Nevada Real Estate Division',
        url: 'https://red.nv.gov/',
    },
    {
        code: 'NH',
        name: 'New Hampshire',
        commissionName: 'New Hampshire Real Estate Commission',
        url: 'https://www.oplc.nh.gov/find-board/nh-real-estate-commission',
    },
    {
        code: 'NJ',
        name: 'New Jersey',
        commissionName: 'New Jersey Real Estate Commission',
        url: 'https://www.nj.gov/dobi/division_rec/',
    },
    {
        code: 'NM',
        name: 'New Mexico',
        commissionName: 'New Mexico Real Estate Commission',
        url: 'https://www.rld.nm.gov/boards-and-commissions/individual-boards-and-commissions/new-mexico-real-estate-commission/',
    },
    {
        code: 'NY',
        name: 'New York',
        commissionName: 'New York Department of State — Division of Licensing',
        url: 'https://dos.ny.gov/real-estate-broker',
    },
    {
        code: 'NC',
        name: 'North Carolina',
        commissionName: 'North Carolina Real Estate Commission',
        url: 'https://www.ncrec.gov/',
    },
    {
        code: 'ND',
        name: 'North Dakota',
        commissionName: 'North Dakota Real Estate Commission',
        url: 'https://www.realestatend.org/',
    },
    {
        code: 'OH',
        name: 'Ohio',
        commissionName: 'Ohio Division of Real Estate and Professional Licensing',
        url: 'https://elicense3.com.ohio.gov/',
    },
    {
        code: 'OK',
        name: 'Oklahoma',
        commissionName: 'Oklahoma Real Estate Commission',
        url: 'https://oklahoma.gov/orec.html',
    },
    {
        code: 'OR',
        name: 'Oregon',
        commissionName: 'Oregon Real Estate Agency',
        url: 'https://www.oregon.gov/rea/',
    },
    {
        code: 'PA',
        name: 'Pennsylvania',
        commissionName: 'Pennsylvania State Real Estate Commission',
        url: 'https://www.dos.pa.gov/ProfessionalLicensing/BoardsCommissions/RealEstateCommission/',
    },
    {
        code: 'RI',
        name: 'Rhode Island',
        commissionName: 'Rhode Island Real Estate Commission',
        url: 'https://dbr.ri.gov/divisions/commercial-licensing/real-estate',
    },
    {
        code: 'SC',
        name: 'South Carolina',
        commissionName: 'South Carolina Real Estate Commission',
        url: 'https://llr.sc.gov/re/',
    },
    {
        code: 'SD',
        name: 'South Dakota',
        commissionName: 'South Dakota Real Estate Commission',
        url: 'https://dlr.sd.gov/realestate/',
    },
    {
        code: 'TN',
        name: 'Tennessee',
        commissionName: 'Tennessee Real Estate Commission',
        url: 'https://www.tn.gov/commerce/regboards/trec.html',
    },
    {
        code: 'TX',
        name: 'Texas',
        commissionName: 'Texas Real Estate Commission',
        url: 'https://www.trec.texas.gov/',
    },
    {
        code: 'UT',
        name: 'Utah',
        commissionName: 'Utah Division of Real Estate',
        url: 'https://realestate.utah.gov/',
    },
    {
        code: 'VT',
        name: 'Vermont',
        commissionName: 'Vermont Real Estate Commission',
        url: 'https://sos.vermont.gov/real-estate-commission/',
    },
    {
        code: 'VA',
        name: 'Virginia',
        commissionName: 'Virginia Real Estate Board',
        url: 'https://www.dpor.virginia.gov/Boards/Real-Estate',
    },
    {
        code: 'WA',
        name: 'Washington',
        commissionName: 'Washington Department of Licensing — Real Estate',
        url: 'https://www.dol.wa.gov/business/realestate/',
    },
    {
        code: 'WV',
        name: 'West Virginia',
        commissionName: 'West Virginia Real Estate Commission',
        url: 'https://rec.wv.gov/',
    },
    {
        code: 'WI',
        name: 'Wisconsin',
        commissionName: 'Wisconsin Real Estate Examining Board',
        url: 'https://dsps.wi.gov/Pages/BoardsCouncils/RealEstate/Default.aspx',
    },
    {
        code: 'WY',
        name: 'Wyoming',
        commissionName: 'Wyoming Real Estate Commission',
        url: 'https://realestate.wyo.gov/',
    },
    {
        code: 'DC',
        name: 'District of Columbia',
        commissionName: 'DC Board of Real Estate',
        url: 'https://dlcp.dc.gov/page/real-estate-board',
    },
]

export function getStateResource(code: string): StateResource | undefined {
    return STATE_RESOURCES.find((s) => s.code === code.toUpperCase())
}
