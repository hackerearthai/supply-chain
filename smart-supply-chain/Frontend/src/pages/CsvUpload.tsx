import { PageHeader } from '@/components/PageHeader';
import { CsvUploadWithMapping } from '@/components/CsvUploadWithMapping';

const CsvUpload = () => {
  return (
    <div className='animate-fade-in'>
      <PageHeader
        eyebrow='Data'
        title='CSV Upload'
        description='Upload large order datasets and map them into the supply chain system.'
      />

      <CsvUploadWithMapping />
    </div>
  );
};

export default CsvUpload;
