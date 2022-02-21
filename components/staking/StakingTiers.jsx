import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
} from '@mui/material';
import theme from '@styles/theme';

const stakingHeading = {
  tier: 'Tier',
  value: 'Amount',
  requirements: 'Staking Requirements',
  weight: 'Allocation Weight',
};

const stakingTiers = [
  {
    tier: '(A) Alpha',
    value: '25000',
    requirements: 'Twitter like, retweet',
    weight: '10',
  },
  {
    tier: '(B) Beta',
    value: '50000',
    requirements: 'Twitter like, retweet',
    weight: '24',
  },
  {
    tier: '(Γ) Gamma',
    value: '100000',
    requirements: 'Twitter like, retweet',
    weight: '58',
  },
  {
    tier: '(Ω) Omega',
    value: '250000',
    requirements: 'Twitter like',
    weight: '175',
  },
  {
    tier: '(Φ) Phi',
    value: '500000',
    requirements: 'Twitter like',
    weight: '420',
  },
  {
    tier: '(Σ) SIgma',
    value: '1500000',
    requirements: 'none',
    weight: '1500',
  },
];

const StakingTiers = () => {
  const checkSmall = useMediaQuery((theme) => theme.breakpoints.up('md'));
  return (
    <>
      <Typography variant="h5" sx={{ fontWeight: '700' }}>
        Staking Tiers
      </Typography>
      {checkSmall ? (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: '800' }}>Tier</TableCell>
              <TableCell sx={{ fontWeight: '800' }}>Amount</TableCell>
              <TableCell sx={{ fontWeight: '800' }}>
                Allocation Weight
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stakingTiers.map((tier) => {
              return (
                <TableRow key={tier.tier}>
                  <TableCell
                    sx={{
                      color: theme.palette.text.secondary,
                      fontWeight: '800',
                    }}
                  >
                    {tier.tier}
                  </TableCell>
                  <TableCell>{tier.value}</TableCell>
                  <TableCell>{tier.weight}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <Table sx={{ p: 0 }}>
          {stakingTiers.map((tier) => {
            return (
              <>
                <TableRow sx={{ borderTop: `1px solid #444` }}>
                  <TableCell
                    sx={{
                      color: theme.palette.text.secondary,
                      border: 'none',
                      p: 1,
                      pt: 2,
                    }}
                  >
                    {stakingHeading.tier}
                  </TableCell>
                  <TableCell sx={{ border: 'none', p: 1, pt: 2 }}>
                    {tier.tier}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell
                    sx={{
                      color: theme.palette.text.secondary,
                      border: 'none',
                      p: 1,
                    }}
                  >
                    {stakingHeading.value}
                  </TableCell>
                  <TableCell sx={{ border: 'none', p: 1 }}>
                    {tier.value}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell
                    sx={{
                      color: theme.palette.text.secondary,
                      border: 'none',
                      p: 1,
                      pb: 2,
                    }}
                  >
                    {stakingHeading.weight}
                  </TableCell>
                  <TableCell sx={{ border: 'none', p: 1, pb: 2 }}>
                    {tier.weight}
                  </TableCell>
                </TableRow>
              </>
            );
          })}
        </Table>
      )}
    </>
  );
};

export default StakingTiers;
