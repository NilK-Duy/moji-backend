import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    hashedPassword: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    displayName: {
      type: String,
      required: true,
      trim: true
    },
    avatarUrl: {
      type: String, // link CDN
    },
    avatarId: {
      type: String, // Cloudinary public ID
    },
    bio: {
      type: String,
      maxlength: 500
    },
    phone: {
      type: String,
      sparse: true, // allows null values ​​but ensures uniqueness for the values
    }
  },
  {
    timestamps: true
  }
);

const User = mongoose.model("User", userSchema);
export default User;
