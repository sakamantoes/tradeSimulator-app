import mongoose from 'mongoose';

const adminSettingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true },
}, { timestamps: true });

const AdminSetting = mongoose.models.AdminSetting || mongoose.model('AdminSetting', adminSettingSchema);

adminSettingSchema.statics.get = async function (key, defaultValue = null) {
  const setting = await this.findOne({ key });
  return setting ? setting.value : defaultValue;
};

export default AdminSetting;
