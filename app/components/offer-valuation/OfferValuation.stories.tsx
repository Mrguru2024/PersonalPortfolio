import OfferValuationTool from "./index";

const meta = {
  title: "Offer Valuation/OfferValuationTool",
  component: OfferValuationTool,
};

export default meta;

export const Internal = {
  render: () => <OfferValuationTool surface="internal" />,
};

export const Public = {
  render: () => <OfferValuationTool surface="public" />,
};

