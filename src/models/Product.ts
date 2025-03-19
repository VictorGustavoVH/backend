import mongoose, { Document, Schema } from "mongoose";

export interface IProduct extends Document {
    name: string
    description: string
    category: string
    image: string
    createdAt: Date
    updatedAt: Date
}

const productSchema = new Schema({
    name : {
        type: String,
        required: true,
    },
    description : {
        type: String,
        required: true,
    },
    category : {
        type: String,
        required: true
    },
    image : {
        type: String,
        default: ''
    },
},
{ timestamps: true}
)

const Product = mongoose.model<IProduct>('Product', productSchema)
export default Product